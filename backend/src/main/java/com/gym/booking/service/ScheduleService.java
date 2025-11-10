package com.gym.booking.service;

import com.gym.booking.model.Schedule;
import com.gym.booking.model.GymClass;
import com.gym.booking.repository.ScheduleRepository;
import com.gym.booking.exception.ResourceNotFoundException;
import com.gym.booking.exception.BookingException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final GymClassService gymClassService;

    public ScheduleService(ScheduleRepository scheduleRepository, GymClassService gymClassService) {
        this.scheduleRepository = scheduleRepository;
        this.gymClassService = gymClassService;
    }

    public Schedule createSchedule(Long gymClassId, LocalDateTime startTime) {
        GymClass gymClass = gymClassService.findById(gymClassId);
        Schedule schedule = new Schedule();
        schedule.setGymClass(gymClass);
        schedule.setStartTime(startTime);
        schedule.setEndTime(startTime.plusMinutes(gymClass.getDurationMinutes()));
        return scheduleRepository.save(schedule);
    }

    public void cancelSchedule(Long id) {
        Schedule schedule = findById(id);
        if (schedule.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BookingException("Cannot cancel past schedules");
        }
        schedule.setCancelled(true);
        scheduleRepository.save(schedule);
    }

    public List<Schedule> findByDateRange(LocalDateTime start, LocalDateTime end) {
        return scheduleRepository.findAllBetweenDates(start, end);
    }

    public List<Schedule> findByTrainerAndDateRange(Long trainerId, LocalDateTime start, LocalDateTime end) {
        return scheduleRepository.findByTrainerAndDateRange(trainerId, start, end);
    }

    public Schedule findById(Long id) {
        return scheduleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));
    }

    public List<Schedule> findByGymClass(Long gymClassId) {
        GymClass gymClass = gymClassService.findById(gymClassId);
        return scheduleRepository.findByGymClass(gymClass);
    }
}