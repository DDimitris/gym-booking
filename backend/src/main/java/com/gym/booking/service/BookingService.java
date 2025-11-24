package com.gym.booking.service;

import com.gym.booking.model.Booking;
import com.gym.booking.model.GymClass;
import com.gym.booking.model.User;
import com.gym.booking.repository.BookingRepository;
import com.gym.booking.exception.ResourceNotFoundException;
import com.gym.booking.exception.BookingException;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@Transactional
public class BookingService {
    private final BookingRepository bookingRepository;
    private final GymClassService gymClassService;
    private final UserService userService;
    private final BillingService billingService;

    private final ZoneId zoneId;

    public BookingService(BookingRepository bookingRepository,
            GymClassService gymClassService,
            UserService userService,
            @Lazy BillingService billingService,
            @org.springframework.beans.factory.annotation.Value("${APP_TIMEZONE:Europe/Athens}") String appTimezone) {
        this.bookingRepository = bookingRepository;
        this.gymClassService = gymClassService;
        this.userService = userService;
        this.billingService = billingService;
        this.zoneId = ZoneId.of(appTimezone);
    }

    public Booking createBooking(Long userId, Long classInstanceId) {
        if (userId == null) {
            throw new BookingException("User id is required");
        }
        if (classInstanceId == null) {
            throw new BookingException("Class instance id is required");
        }
        User user = userService.findById(userId);
        GymClass classInstance = gymClassService.findById(classInstanceId);

        validateBooking(user, classInstance);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setClassInstance(classInstance);
        booking.setStatus(Booking.BookingStatus.BOOKED);
        return bookingRepository.save(booking);
    }

    private void validateBooking(User user, GymClass classInstance) {
        // Disallow self-booking for staff (ADMIN/TRAINER) – they must book on behalf
        // of members instead
        if (user.getRole() == User.UserRole.TRAINER || user.getRole() == User.UserRole.ADMIN) {
            throw new BookingException(
                    "Staff cannot book themselves into classes; book on behalf of a member instead.");
        }
        if (classInstance.isCancelled()) {
            throw new BookingException("This class has been cancelled");
        }

        ZonedDateTime classStartZ = classInstance.getStartTime().atZone(zoneId);
        ZonedDateTime nowZ = ZonedDateTime.now(zoneId);
        if (classStartZ.isBefore(nowZ)) {
            throw new BookingException("Cannot book past classes");
        }

        long confirmedBookings = bookingRepository.countByClassInstanceAndStatus(
                classInstance, Booking.BookingStatus.BOOKED);
        if (confirmedBookings >= classInstance.getCapacity()) {
            throw new BookingException("Class is fully booked");
        }

        List<Booking> existingBookings = bookingRepository.findByClassInstanceAndUserAndStatus(
                classInstance, user, Booking.BookingStatus.BOOKED);
        if (!existingBookings.isEmpty()) {
            throw new BookingException("User already has a booking for this class");
        }

        // Enforce wallet/bonus validation: user must have either sufficient wallet
        // balance for the class kind, or at least 1 bonus day to cover the class.
        java.math.BigDecimal chargeAmount = billingService.getChargeAmountForClass(user, classInstance);
        java.math.BigDecimal wallet = java.util.Optional.ofNullable(user.getWalletBalance())
                .orElse(java.math.BigDecimal.ZERO);
        Integer bonus = java.util.Optional.ofNullable(user.getBonusDays()).orElse(0);

        boolean canPayWithWallet = wallet.compareTo(chargeAmount) >= 0;
        boolean canUseBonus = bonus > 0;

        if (chargeAmount.compareTo(java.math.BigDecimal.ZERO) > 0 && !canPayWithWallet && !canUseBonus) {
            throw new BookingException("Insufficient funds: wallet=" + wallet + " bonusDays=" + bonus +
                    " required=" + chargeAmount + ". Please top-up wallet or use a bonus day.");
        }
    }

    public void cancelBooking(Long bookingId) {
        Booking booking = findById(bookingId);
        ZonedDateTime startZ = booking.getClassInstance().getStartTime().atZone(zoneId);
        if (startZ.isBefore(ZonedDateTime.now(zoneId))) {
            throw new BookingException("Cannot cancel past bookings");
        }
        booking.setStatus(Booking.BookingStatus.CANCELLED_BY_USER);
        booking.setCancelledAt(LocalDateTime.now(zoneId));
        bookingRepository.save(booking);

        // Create billing event if same-day cancellation (user-initiated only)
        billingService.createCancellationCharge(booking);
    }

    public void markCompleted(Long bookingId) {
        Booking booking = findById(bookingId);
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        booking.setAttendedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        // Attempt to create and auto-settle billing for completed booking
        billingService.createCompletionCharge(booking);
    }

    public List<Booking> findByUser(Long userId) {
        if (userId == null) {
            return java.util.Collections.emptyList();
        }
        User user = userService.findById(userId);
        return bookingRepository.findByUser(user);
    }

    public List<Booking> findByClassInstance(Long classInstanceId) {
        if (classInstanceId == null) {
            return java.util.Collections.emptyList();
        }
        GymClass classInstance = gymClassService.findById(classInstanceId);
        return bookingRepository.findByClassInstance(classInstance);
    }

    /**
     * Admin/gym-initiated cancellation of a class instance.
     *
     * Marks all active bookings for the class as CANCELLED_BY_GYM without
     * creating any billing events. This is used when an admin cancels or
     * deletes a class; members must never be charged for these cancellations.
     */
    public void cancelBookingsByGymForClass(Long classInstanceId) {
        if (classInstanceId == null) {
            return;
        }
        GymClass classInstance = gymClassService.findById(classInstanceId);
        List<Booking> bookings = bookingRepository.findByClassInstance(classInstance);
        LocalDateTime now = LocalDateTime.now();

        for (Booking booking : bookings) {
            if (booking.getStatus() == Booking.BookingStatus.BOOKED) {
                booking.setStatus(Booking.BookingStatus.CANCELLED_BY_GYM);
                booking.setCancelledAt(now);
                bookingRepository.save(booking);
            }
        }
    }

    /**
     * Count all active (BOOKED) bookings for a given class instance.
     */
    public long countActiveBookingsForClass(GymClass classInstance) {
        if (classInstance == null) {
            return 0L;
        }
        return bookingRepository.countByClassInstanceAndStatus(classInstance, Booking.BookingStatus.BOOKED);
    }

    public long countBookedByClassInstance(Long classInstanceId) {
        if (classInstanceId == null) {
            return 0L;
        }
        GymClass classInstance = gymClassService.findById(classInstanceId);
        return bookingRepository.countByClassInstanceAndStatus(classInstance, Booking.BookingStatus.BOOKED);
    }

    public Booking findById(Long id) {
        if (id == null) {
            throw new BookingException("Booking id is required");
        }
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }
}