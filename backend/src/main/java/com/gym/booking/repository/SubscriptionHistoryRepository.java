package com.gym.booking.repository;

import com.gym.booking.model.SubscriptionHistory;
import com.gym.booking.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, Long> {
    List<SubscriptionHistory> findBySubscriptionOrderByCreatedAtDesc(Subscription subscription);
}
