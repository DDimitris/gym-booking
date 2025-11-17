package com.gym.booking.service;

import com.gym.booking.exception.ResourceNotFoundException;
import com.gym.booking.model.GymClass;
import com.gym.booking.model.User;
import com.gym.booking.repository.GymClassRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class GymClassService {
    private final GymClassRepository gymClassRepository;
    private final UserService userService;
    private final BookingService bookingService;

    public GymClassService(GymClassRepository gymClassRepository, UserService userService,
        @Lazy BookingService bookingService) {
        this.gymClassRepository = gymClassRepository;
        this.userService = userService;
        this.bookingService = bookingService;
    }

    public GymClass createGymClass(@NonNull GymClass gymClass, @NonNull Long trainerId) {
        User instructor = userService.findById(trainerId);
        // Allow ADMIN or TRAINER to create classes
        if (instructor.getRole() != User.UserRole.TRAINER && instructor.getRole() != User.UserRole.ADMIN) {
            throw new IllegalArgumentException("The specified user is not authorized to be a trainer for a class");
        }
        gymClass.setTrainer(instructor);
        return gymClassRepository.save(gymClass);
    }

    public GymClass updateGymClass(@NonNull Long id, @NonNull GymClass gymClassDetails) {
        GymClass gymClass = gymClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gym class not found with id: " + id));

        gymClass.setDescription(gymClassDetails.getDescription());
        gymClass.setCapacity(gymClassDetails.getCapacity());
        gymClass.setDurationMinutes(gymClassDetails.getDurationMinutes());
        gymClass.setStartTime(gymClassDetails.getStartTime());
        gymClass.setEndTime(gymClassDetails.getEndTime());
        gymClass.setLocation(gymClassDetails.getLocation());

        return gymClassRepository.save(gymClass);
    }

    public void deleteGymClass(@NonNull Long id) {
                GymClass gymClass = gymClassRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Gym class not found with id: " + id));

                // If the class has no attendees at all, we can safely hard-delete it.
                // This avoids cluttering the schedule/history with unused classes.
                long bookedCount = bookingService.countActiveBookingsForClass(gymClass);
                if (bookedCount == 0) {
                        gymClassRepository.delete(gymClass);
                        return;
                }

                // When an admin deletes/cancels a class that has attendees, mark the instance as cancelled and
                // mark all associated bookings as cancelled by gym, without creating billing events.
                gymClass.setStatus(GymClass.ClassStatus.CANCELLED);
                gymClass.setIsCancelled(true);
                gymClassRepository.save(gymClass);

                // Cancel all active bookings for this class as CANCELLED_BY_GYM (no billing)
                bookingService.cancelBookingsByGymForClass(id);
    }

    public List<GymClass> findAll() {
        return gymClassRepository.findAll();
    }

    public GymClass findById(@NonNull Long id) {
        return gymClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gym class not found with id: " + id));
    }

    public List<GymClass> findByTrainer(@NonNull Long trainerId) {
        User trainer = userService.findById(trainerId);
        return gymClassRepository.findByTrainer(trainer);
    }

    // Removed searchByName() - cannot search by name as it's derived from ClassType
}