package com.gym.booking.repository;

import com.gym.booking.model.Subscription;
import com.gym.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserAndStatus(User user, Subscription.Status status);
}
