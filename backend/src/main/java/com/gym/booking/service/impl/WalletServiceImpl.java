package com.gym.booking.service.impl;

import com.gym.booking.model.Booking;
import com.gym.booking.model.User;
import com.gym.booking.model.WalletTransaction;
import com.gym.booking.repository.WalletTransactionRepository;
import com.gym.booking.service.UserService;
import com.gym.booking.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WalletServiceImpl implements WalletService {

    private final WalletTransactionRepository repo;
    private final UserService userService;
    private final com.gym.booking.service.SubscriptionService subscriptionService;

    public WalletServiceImpl(WalletTransactionRepository repo, UserService userService,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.gym.booking.service.SubscriptionService subscriptionService) {
        this.repo = repo;
        this.userService = userService;
        this.subscriptionService = subscriptionService;
    }

    private void startPendingAfterDrain(Long userId) {
        if (this.subscriptionService != null) {
            // If user's wallet is now zero, start pending subscription
            java.math.BigDecimal wallet = java.util.Optional.ofNullable(userService.findById(userId).getWalletBalance())
                    .orElse(java.math.BigDecimal.ZERO);
            if (wallet.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                subscriptionService.startPendingSubscription(userId);
            }
        }
    }

    @Override
    public BigDecimal getBalance(Long userId) {
        User user = userService.findById(userId);
        return Optional.ofNullable(user.getWalletBalance()).orElse(BigDecimal.ZERO);
    }

    @Override
    public WalletTransaction topUp(Long userId, BigDecimal amount, String reference) {
        if (amount == null)
            throw new IllegalArgumentException("amount required");
        if (amount.signum() <= 0)
            throw new IllegalArgumentException("amount must be positive");
        // Use atomic credit and then fetch fresh user for the ledger entry
        userService.creditBalance(userId, amount);
        User user = userService.findById(userId);

        WalletTransaction tx = new WalletTransaction();
        tx.setUser(user);
        tx.setAmount(amount);
        tx.setType("TOPUP");
        tx.setReference(reference);
        return repo.save(tx);
    }

    @Override
    public WalletTransaction setBalance(Long userId, BigDecimal amount, String reference) {
        if (amount == null)
            throw new IllegalArgumentException("amount required");
        // Record old balance for ledger, then set atomically
        User user = userService.findById(userId);
        BigDecimal old = Optional.ofNullable(user.getWalletBalance()).orElse(BigDecimal.ZERO);
        userService.setBalanceAtomic(userId, amount);
        User fresh = userService.findById(userId);

        WalletTransaction tx = new WalletTransaction();
        tx.setUser(fresh);
        tx.setAmount(amount.subtract(old));
        tx.setType("SET");
        tx.setReference(reference);
        return repo.save(tx);
    }

    @Override
    public WalletChargeResult chargeForBooking(Long userId, BigDecimal amount, Booking booking) {
        if (amount == null)
            amount = BigDecimal.ZERO;
        BigDecimal charged = BigDecimal.ZERO;
        boolean bonusConsumed = false;

        // Try atomic full debit first
        int fullDebited = userService.debitIfSufficient(userId, amount);
        if (fullDebited == 1) {
            User fresh = userService.findById(userId);
            WalletTransaction tx = new WalletTransaction();
            tx.setUser(fresh);
            tx.setAmount(amount.negate());
            tx.setType("CHARGE");
            tx.setReference(booking != null ? "booking:" + booking.getId() : null);
            repo.save(tx);
            charged = amount;
            // If wallet reached zero after this charge, attempt to start pending
            // subscription
            try {
                this.startPendingAfterDrain(userId);
            } catch (Exception ex) {
                /* ignore */ }
            return new WalletChargeResult(true, false, charged);
        }

        // Attempt to drain whatever is left in wallet using compare-and-set retries
        for (int i = 0; i < 3; i++) {
            User u = userService.findById(userId);
            BigDecimal wallet = Optional.ofNullable(u.getWalletBalance()).orElse(BigDecimal.ZERO);
            if (wallet.compareTo(BigDecimal.ZERO) <= 0)
                break;

            int drained = userService.compareAndSetBalance(userId, wallet, BigDecimal.ZERO);
            if (drained == 1) {
                charged = wallet;
                User fresh = userService.findById(userId);
                WalletTransaction tx = new WalletTransaction();
                tx.setUser(fresh);
                tx.setAmount(charged.negate());
                tx.setType("CHARGE_PARTIAL");
                tx.setReference(booking != null ? "booking:" + booking.getId() : null);
                repo.save(tx);
                try {
                    this.startPendingAfterDrain(userId);
                } catch (Exception ex) {
                    /* ignore */ }
                break;
            }
            // else retry
        }

        // Try to consume a bonus day atomically
        int bonusDecr = userService.decrementBonusIfPositive(userId);
        if (bonusDecr == 1) {
            bonusConsumed = true;
            return new WalletChargeResult(true, true, charged);
        }

        // Not fully settled
        return new WalletChargeResult(false, false, charged);
    }

    @Override
    public List<WalletTransaction> getTransactions(Long userId) {
        User user = userService.findById(userId);
        return repo.findByUserOrderByCreatedAtDesc(user);
    }
}
