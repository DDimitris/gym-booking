package com.gym.booking.service;

import com.gym.booking.model.Subscription;
import com.gym.booking.model.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface SubscriptionService {
    // Create a subscription for the given user. The `days` parameter is the
    // number of days the subscription should last; the service computes the
    // end date using plusDays.
    Subscription createSubscription(Long userId, BigDecimal initialPayment, int days);

    Optional<Subscription> getActiveByUser(Long userId);

    List<Subscription> getHistory(Long userId);

    java.util.List<com.gym.booking.dto.SubscriptionHistoryDTO> getEnrichedHistory(Long userId);

    void cancelSubscription(Long subscriptionId, String reason);

    void incrementLateCancellation(Subscription subscription);

    void startPendingSubscription(Long userId);
}
