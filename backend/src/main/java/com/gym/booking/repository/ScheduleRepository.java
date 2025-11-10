package com.gym.booking.repository;

import com.gym.booking.model.Schedule;
import com.gym.booking.model.GymClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByGymClass(GymClass gymClass);
    
    @Query("SELECT s FROM Schedule s WHERE s.startTime >= :start AND s.startTime < :end AND s.isCancelled = false")
    List<Schedule> findAllBetweenDates(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT s FROM Schedule s WHERE s.gymClass.trainer.id = :trainerId AND s.startTime >= :start AND s.startTime < :end")
    List<Schedule> findByTrainerAndDateRange(Long trainerId, LocalDateTime start, LocalDateTime end);
}