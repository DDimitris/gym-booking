package com.gym.booking.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;
import com.gym.booking.model.GymClass;
import com.gym.booking.model.Booking;
import com.gym.booking.service.BillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class BookingCompletionScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingCompletionScheduler.class);

    private final com.gym.booking.repository.BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final com.gym.booking.repository.GymClassRepository gymClassRepository;
    private final BillingService billingService;

    public BookingCompletionScheduler(com.gym.booking.repository.BookingRepository bookingRepository,
            BookingService bookingService,
            com.gym.booking.repository.GymClassRepository gymClassRepository,
            BillingService billingService) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.gymClassRepository = gymClassRepository;
        this.billingService = billingService;
    }

    // Run periodically (default every 10 minutes). Configurable via env var
    // 'BOOKING_COMPLETION_POLL_MS' as milliseconds.
    @Scheduled(fixedDelayString = "${BOOKING_COMPLETION_POLL_MS:600000}")
    public void completePastBookings() {
        LocalDateTime now = LocalDateTime.now();
        log.debug("BookingCompletionScheduler triggered at {}", now);
        // First, mark any finished class instances as COMPLETED so front-end and
        // reports see correct status
        List<GymClass> finished = gymClassRepository.findByStatusAndEndTimeBefore(GymClass.ClassStatus.SCHEDULED, now);
        log.info("BookingCompletionScheduler found {} classes to mark COMPLETED", finished.size());
        for (GymClass g : finished) {
            try {
                g.setStatus(GymClass.ClassStatus.COMPLETED);
                gymClassRepository.save(g);
                log.info("Marked class id={} COMPLETED", g.getId());
            } catch (Exception ex) {
                log.error("Failed to mark class id={} completed", g.getId(), ex);
            }
        }

        List<Booking> pending = bookingRepository.findBookingsToComplete(Booking.BookingStatus.BOOKED, now);
        log.info("BookingCompletionScheduler found {} bookings to complete", pending.size());
        for (Booking b : pending) {
            try {
                bookingService.markCompleted(b.getId());
                log.info("Auto-completed booking id={}", b.getId());
            } catch (Exception ex) {
                // Log and continue; do not fail the scheduler
                log.error("Failed to auto-complete booking id={}", b.getId(), ex);
            }
        }
    }
}
