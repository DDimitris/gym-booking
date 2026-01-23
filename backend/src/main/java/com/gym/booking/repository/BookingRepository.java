package com.gym.booking.repository;

import com.gym.booking.model.Booking;
import com.gym.booking.model.GymClass;
import com.gym.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUser(User user);

    void deleteByUser(User user);

    List<Booking> findByClassInstance(GymClass classInstance);

    long countByClassInstanceAndStatus(GymClass classInstance, Booking.BookingStatus status);

    List<Booking> findByClassInstanceAndUserAndStatus(GymClass classInstance, User user, Booking.BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.classInstance.endTime < :now")
    List<Booking> findBookingsToComplete(@Param("status") com.gym.booking.model.Booking.BookingStatus status,
            @Param("now") LocalDateTime now);
}