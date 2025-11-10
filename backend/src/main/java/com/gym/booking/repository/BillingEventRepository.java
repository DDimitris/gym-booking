package com.gym.booking.repository;

import com.gym.booking.model.BillingEvent;
import com.gym.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BillingEventRepository extends JpaRepository<BillingEvent, Long> {
    List<BillingEvent> findByUser(User user);

    List<BillingEvent> findByUserAndSettledFalse(User user);

    @Query("SELECT b FROM BillingEvent b WHERE b.user = :user AND b.eventDate BETWEEN :startDate AND :endDate")
    List<BillingEvent> findByUserAndDateRange(
            @Param("user") User user,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT b FROM BillingEvent b WHERE b.eventDate BETWEEN :startDate AND :endDate")
    List<BillingEvent> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
