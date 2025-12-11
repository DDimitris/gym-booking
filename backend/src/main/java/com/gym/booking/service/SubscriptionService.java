package com.gym.booking.service;

import com.gym.booking.model.Subscription;
import com.gym.booking.model.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface SubscriptionService {
    Subscription createSubscription(Long userId, BigDecimal initialPayment, int months);

    Optional<Subscription> getActiveByUser(Long userId);

    List<Subscription> getHistory(Long userId);

    void cancelSubscription(Long subscriptionId, String reason);

    void incrementLateCancellation(Subscription subscription);

    void startPendingSubscription(Long userId);
}
