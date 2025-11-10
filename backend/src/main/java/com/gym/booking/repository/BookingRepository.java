package com.gym.booking.repository;

import com.gym.booking.model.Booking;
import com.gym.booking.model.GymClass;
import com.gym.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUser(User user);

    List<Booking> findByClassInstance(GymClass classInstance);

    long countByClassInstanceAndStatus(GymClass classInstance, Booking.BookingStatus status);

    List<Booking> findByClassInstanceAndUserAndStatus(GymClass classInstance, User user, Booking.BookingStatus status);
}