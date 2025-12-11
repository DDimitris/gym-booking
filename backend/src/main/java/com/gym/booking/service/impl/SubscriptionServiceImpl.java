package com.gym.booking.service.impl;

import com.gym.booking.model.Subscription;
import com.gym.booking.model.SubscriptionHistory;
import com.gym.booking.model.User;
import com.gym.booking.repository.SubscriptionHistoryRepository;
import com.gym.booking.repository.SubscriptionRepository;
import com.gym.booking.service.SubscriptionService;
import com.gym.booking.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository repo;
    private final SubscriptionHistoryRepository historyRepo;
    private final UserService userService;

    public SubscriptionServiceImpl(SubscriptionRepository repo, SubscriptionHistoryRepository historyRepo,
            UserService userService) {
        this.repo = repo;
        this.historyRepo = historyRepo;
        this.userService = userService;
    }

    @Override
    public Subscription createSubscription(Long userId, BigDecimal initialPayment, int months) {
        User user = userService.findById(userId);

        // Ensure no active subscription
        Optional<Subscription> existing = repo.findByUserAndStatus(user, Subscription.Status.ACTIVE);
        if (existing.isPresent()) {
            throw new RuntimeException("User already has an active subscription");
        }

        Subscription sub = new Subscription();
        sub.setUser(user);
        sub.setInitialPayment(initialPayment);
        sub.setMonths(months);

        // Start immediately only if wallet is zero
        java.math.BigDecimal wallet = java.util.Optional.ofNullable(user.getWalletBalance())
                .orElse(java.math.BigDecimal.ZERO);
        if (wallet.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            LocalDate start = LocalDate.now();
            sub.setStartDate(start);
            sub.setEndDate(start.plusMonths(months));
            sub.setStatus(Subscription.Status.ACTIVE);
        } else {
            sub.setStatus(Subscription.Status.PENDING);
        }

        Subscription saved = repo.save(sub);
        SubscriptionHistory ev = new SubscriptionHistory();
        ev.setSubscription(saved);
        ev.setEventType("CREATED");
        ev.setEventData("initialPayment=" + initialPayment + ", months=" + months + ", status=" + saved.getStatus());
        ev.setCreatedAt(java.time.LocalDateTime.now());
        historyRepo.save(ev);
        return saved;
    }

    @Override
    public Optional<Subscription> getActiveByUser(Long userId) {
        User user = userService.findById(userId);
        return repo.findByUserAndStatus(user, Subscription.Status.ACTIVE);
    }

    @Override
    public List<Subscription> getHistory(Long userId) {
        User user = userService.findById(userId);
        List<Subscription> all = repo.findAll();
        List<Subscription> out = new ArrayList<>();
        for (Subscription s : all) {
            if (s.getUser().getId().equals(userId))
                out.add(s);
        }
        return out;
    }

    @Override
    public void cancelSubscription(Long subscriptionId, String reason) {
        Subscription s = repo.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
        s.setStatus(Subscription.Status.CANCELLED);
        s.setEndDate(LocalDate.now());
        repo.save(s);

        SubscriptionHistory ev = new SubscriptionHistory();
        ev.setSubscription(s);
        ev.setEventType("CANCELLED");
        ev.setEventData(reason);
        ev.setCreatedAt(java.time.LocalDateTime.now());
        historyRepo.save(ev);
    }

    @Override
    public void incrementLateCancellation(Subscription subscription) {
        subscription.setLateCancellations(subscription.getLateCancellations() + 1);
        if (subscription.getLateCancellations() >= 4) {
            // cancel and block user
            subscription.setStatus(Subscription.Status.CANCELLED);
            subscription.setEndDate(LocalDate.now());
            User user = subscription.getUser();
            user.setBookingBlocked(true);
            userService.createUser(user);
            SubscriptionHistory ev = new SubscriptionHistory();
            ev.setSubscription(subscription);
            ev.setEventType("AUTO_CANCEL_MAX_LATE_CANCELLATIONS");
            ev.setEventData("lateCancellations=" + subscription.getLateCancellations());
            ev.setCreatedAt(java.time.LocalDateTime.now());
            historyRepo.save(ev);
        } else {
            SubscriptionHistory ev = new SubscriptionHistory();
            ev.setSubscription(subscription);
            ev.setEventType("LATE_CANCELLATION_INCREMENT");
            ev.setEventData("lateCancellations=" + subscription.getLateCancellations());
            ev.setCreatedAt(java.time.LocalDateTime.now());
            historyRepo.save(ev);
        }
        repo.save(subscription);
    }

    @Override
    public void startPendingSubscription(Long userId) {
        User user = userService.findById(userId);
        java.util.Optional<Subscription> opt = repo.findByUserAndStatus(user, Subscription.Status.PENDING);
        if (opt.isPresent()) {
            Subscription s = opt.get();
            LocalDate start = LocalDate.now();
            s.setStartDate(start);
            s.setEndDate(start.plusMonths(s.getMonths()));
            s.setStatus(Subscription.Status.ACTIVE);
            repo.save(s);
            SubscriptionHistory ev = new SubscriptionHistory();
            ev.setSubscription(s);
            ev.setEventType("STARTED");
            ev.setEventData("started after wallet drained");
            ev.setCreatedAt(java.time.LocalDateTime.now());
            historyRepo.save(ev);
        }
    }
}
