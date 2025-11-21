package com.gym.booking.service;

import com.gym.booking.model.Booking;
import com.gym.booking.model.BillingEvent;
import com.gym.booking.model.GymClass;
import com.gym.booking.model.User;
import com.gym.booking.repository.BillingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BillingService {
    private final BillingEventRepository billingEventRepository;
    private final UserService userService;
    private final com.gym.booking.service.WalletService walletService;

    // Same-day cancellation threshold (12 hours before class start)
    private static final long SAME_DAY_THRESHOLD_HOURS = 12;

    public BillingService(BillingEventRepository billingEventRepository,
            UserService userService,
            @org.springframework.beans.factory.annotation.Autowired(required = false) @org.springframework.context.annotation.Lazy com.gym.booking.service.WalletService walletService) {
        this.billingEventRepository = billingEventRepository;
        this.userService = userService;
        this.walletService = walletService;
    }

    private BigDecimal resolveBaseCostForClass(User user, GymClass gymClass) {
        if (gymClass == null || gymClass.getKind() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal amount = switch (gymClass.getKind()) {
            case GROUP -> user.getGroupBaseCost();
            case SMALL_GROUP -> user.getSmallGroupBaseCost();
            case PERSONAL -> user.getPersonalBaseCost();
            case OPEN_GYM -> user.getOpenGymBaseCost();
        };

        return amount != null ? amount : BigDecimal.ZERO;
    }

    /**
     * Public helper to obtain the charge amount for a given user and class.
     * This is used by other services (e.g. booking) to check eligibility without
     * duplicating the resolve logic.
     */
    public BigDecimal getChargeAmountForClass(User user, GymClass gymClass) {
        return resolveBaseCostForClass(user, gymClass);
    }

    /**
     * Calculate and create billing event for same-day cancellation.
     * Charges apply if cancelled within SAME_DAY_THRESHOLD_HOURS of class start
     * time.
     */
    public BillingEvent createCancellationCharge(Booking booking) {
        LocalDateTime classStartTime = booking.getClassInstance().getStartTime();
        LocalDateTime cancellationTime = booking.getCancelledAt() != null
                ? booking.getCancelledAt()
                : LocalDateTime.now();

        long hoursUntilClass = Duration.between(cancellationTime, classStartTime).toHours();

        // Only charge if cancelled within same-day threshold
        if (hoursUntilClass < SAME_DAY_THRESHOLD_HOURS) {
            User user = booking.getUser();
            BigDecimal chargeAmount = resolveBaseCostForClass(user, booking.getClassInstance());
            if (chargeAmount == null) {
                chargeAmount = BigDecimal.ZERO;
            }

            // Attempt to settle automatically via wallet (consume wallet and optionally a bonus day)
            if (walletService != null) {
                WalletService.WalletChargeResult res = walletService.chargeForBooking(user.getId(), chargeAmount, booking);

                BillingEvent event = new BillingEvent();
                event.setUser(user);
                event.setBooking(booking);
                event.setAmount(chargeAmount);
                event.setReason("Same-day cancellation (cancelled " + hoursUntilClass + " hours before class)");
                event.setEventDate(LocalDateTime.now());

                if (res.fullySettled()) {
                    event.setSettled(true);
                    event.setSettlementType(res.bonusConsumed() ? BillingEvent.SettlementType.BONUS : BillingEvent.SettlementType.PAYMENT);
                    return billingEventRepository.save(event);
                } else {
                    // Partially paid or unpaid: create event and mark unsettled
                    event.setSettled(false);
                    event.setSettlementType(BillingEvent.SettlementType.NONE);
                    BillingEvent saved = billingEventRepository.save(event);
                    return saved;
                }
            } else {
                BillingEvent event = new BillingEvent();
                event.setUser(user);
                event.setBooking(booking);
                event.setAmount(chargeAmount);
                event.setReason("Same-day cancellation (cancelled " + hoursUntilClass + " hours before class)");
                event.setEventDate(LocalDateTime.now());
                event.setSettled(false);
                event.setSettlementType(BillingEvent.SettlementType.NONE);
                return billingEventRepository.save(event);
            }
        }

        return null; // No charge
    }

    /**
     * Get unsettled billing events for a user (what they owe)
     */
    public List<BillingEvent> getUnsettledCharges(Long userId) {
        User user = userService.findById(userId);
        return billingEventRepository.findByUserAndSettledFalse(user);
    }

    /**
     * Get billing events for a date range (for admin reports)
     */
    public List<BillingEvent> getEventsForDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return billingEventRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Get billing events for a specific user in a date range
     */
    public List<BillingEvent> getUserEventsForDateRange(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        User user = userService.findById(userId);
        return billingEventRepository.findByUserAndDateRange(user, startDate, endDate);
    }

    /**
     * Mark billing events as settled (after payment)
     */
    public void markAsSettled(Long eventId) {
        BillingEvent event = billingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Billing event not found"));
        event.setSettled(true);
        if (event.getSettlementType() == null || event.getSettlementType() == BillingEvent.SettlementType.NONE) {
            event.setSettlementType(BillingEvent.SettlementType.PAYMENT);
        }
        billingEventRepository.save(event);
    }

    /**
     * Mark multiple billing events as settled
     */
    public void markAsSettledBulk(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty())
            return;
        for (Long id : eventIds) {
            markAsSettled(id);
        }
    }

    /**
     * Create and attempt to settle a billing event for a completed booking.
     */
    public BillingEvent createCompletionCharge(Booking booking) {
        User user = booking.getUser();
        BigDecimal chargeAmount = resolveBaseCostForClass(user, booking.getClassInstance());
        if (chargeAmount == null) chargeAmount = BigDecimal.ZERO;

        if (walletService != null) {
            WalletService.WalletChargeResult res = walletService.chargeForBooking(user.getId(), chargeAmount, booking);

            BillingEvent event = new BillingEvent();
            event.setUser(user);
            event.setBooking(booking);
            event.setAmount(chargeAmount);
            event.setReason("Class completed");
            event.setEventDate(LocalDateTime.now());

            if (res.fullySettled()) {
                event.setSettled(true);
                event.setSettlementType(res.bonusConsumed() ? BillingEvent.SettlementType.BONUS : BillingEvent.SettlementType.PAYMENT);
                return billingEventRepository.save(event);
            } else {
                event.setSettled(false);
                event.setSettlementType(BillingEvent.SettlementType.NONE);
                return billingEventRepository.save(event);
            }
        } else {
            BillingEvent event = new BillingEvent();
            event.setUser(user);
            event.setBooking(booking);
            event.setAmount(chargeAmount);
            event.setReason("Class completed");
            event.setEventDate(LocalDateTime.now());
            event.setSettled(false);
            event.setSettlementType(BillingEvent.SettlementType.NONE);
            return billingEventRepository.save(event);
        }
    }

    /**
     * Settle a billing event explicitly as a normal payment.
     */
    public void settleAsPayment(Long eventId) {
        BillingEvent event = billingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Billing event not found"));
        event.setSettled(true);
        event.setSettlementType(BillingEvent.SettlementType.PAYMENT);
        billingEventRepository.save(event);
    }

    /**
     * Settle a billing event using one bonus day for the associated user.
     * Assumes 1 bonus day = settlement for 1 billing event.
     */
    public void settleAsBonus(Long eventId) {
        BillingEvent event = billingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Billing event not found"));
        User user = event.getUser();
        if (user == null) {
            throw new RuntimeException("Billing event has no associated user");
        }

        Integer bonusDays = user.getBonusDays();
        if (bonusDays == null || bonusDays <= 0) {
            throw new RuntimeException("User has no bonus days available");
        }

        user.setBonusDays(bonusDays - 1);
        // Persist user bonus day change
        userService.createUser(user);

        event.setSettled(true);
        event.setSettlementType(BillingEvent.SettlementType.BONUS);
        billingEventRepository.save(event);
    }
}
