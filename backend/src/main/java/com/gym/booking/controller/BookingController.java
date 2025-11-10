package com.gym.booking.controller;

import com.gym.booking.dto.BookingDTO;
import com.gym.booking.model.Booking;
import com.gym.booking.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

import com.gym.booking.service.UserService;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private static final Logger log = LoggerFactory.getLogger(BookingController.class);
    private final BookingService bookingService;
    private final UserService userService;
    private final com.gym.booking.service.GymClassService gymClassService;

    public BookingController(BookingService bookingService, UserService userService,
            com.gym.booking.service.GymClassService gymClassService) {
        this.bookingService = bookingService;
        this.userService = userService;
        this.gymClassService = gymClassService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(@RequestParam(required = false) Long userId,
            @RequestParam Long classInstanceId,
            Authentication authentication) {
        // Resolve current user from JWT
        Long currentUserId;
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            var user = userService.findOrCreateFromJwtClaims(claims);
            currentUserId = user.getId();
        } else {
            throw new IllegalArgumentException("Unable to resolve current user from authentication token");
        }

        Long effectiveUserId = currentUserId;
        // Allow booking on behalf of another user only for ADMIN/TRAINER
        if (userId != null) {
            boolean isPrivileged = authentication.getAuthorities().stream()
                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                    .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_TRAINER".equals(a));
            if (isPrivileged) {
                effectiveUserId = userId;
            }
        }
        Booking booking = bookingService.createBooking(effectiveUserId, classInstanceId);
        return ResponseEntity.ok(convertToDTO(booking));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return ResponseEntity.status(401).build();
        }
        Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
        var currentUser = userService.findOrCreateFromJwtClaims(claims);
        // Ownership or privileged role check
        Booking booking = bookingService.findById(id);
        boolean isPrivileged = authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_TRAINER".equals(a));
        if (!isPrivileged && !booking.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(java.util.Map.of("message", "You may only cancel your own bookings"));
        }
        bookingService.cancelBooking(id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('TRAINER')")
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> markCompleted(@PathVariable Long id) {
        bookingService.markCompleted(id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingDTO>> getUserBookings(@PathVariable Long userId) {
        List<Booking> bookings = bookingService.findByUser(userId);
        List<BookingDTO> bookingDTOs = bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookingDTOs);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<List<BookingDTO>> getMyBookings(Authentication authentication) {
        Long effectiveUserId;
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            var user = userService.findOrCreateFromJwtClaims(claims);
            effectiveUserId = user.getId();
        } else {
            throw new IllegalArgumentException("Unable to resolve current user from authentication token");
        }
        List<Booking> bookings = bookingService.findByUser(effectiveUserId);
        List<BookingDTO> bookingDTOs = bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookingDTOs);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/class/{classInstanceId}")
    public ResponseEntity<List<BookingDTO>> getClassBookings(@PathVariable("classInstanceId") long classInstanceId,
            Authentication authentication) {
        // Resolve current user and authorize: admin OR instructor assigned to the class
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return ResponseEntity.status(401).build();
        }
        java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
        var currentUser = userService.findOrCreateFromJwtClaims(claims);

        // Authorize based on token authorities (not persisted role)
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a));
        boolean isTrainer = authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_TRAINER".equals(a));

        if (log.isDebugEnabled()) {
            String authorities = authentication.getAuthorities().stream()
                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                    .sorted()
                    .collect(java.util.stream.Collectors.joining(","));
            log.debug("AttendeesAccess classId={} userId={} isAdmin={} isTrainer={} auth=[{}]", classInstanceId,
                    currentUser.getId(), isAdmin, isTrainer, authorities);
        }

        // Allow all staff (ADMIN or TRAINER) to view attendees
        if (!(isAdmin || isTrainer)) {
            var gymClass = gymClassService.findById(classInstanceId);
            boolean isInstructorForClass = gymClass.getTrainer() != null &&
                    gymClass.getTrainer().getId().equals(currentUser.getId());
            if (!isInstructorForClass) {
                return ResponseEntity.status(403)
                        .body(java.util.Collections.emptyList());
            }
        }
        List<Booking> bookings = bookingService.findByClassInstance(classInstanceId);
        List<BookingDTO> bookingDTOs = bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookingDTOs);
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/class/{classInstanceId}/count")
    public ResponseEntity<java.util.Map<String, Long>> getClassBookingsCount(@PathVariable Long classInstanceId) {
        long count = bookingService.countBookedByClassInstance(classInstanceId);
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }

    private BookingDTO convertToDTO(Booking booking) {
        BookingDTO dto = new BookingDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUser().getId());
        dto.setUserName(booking.getUser().getName());
        dto.setClassInstanceId(booking.getClassInstance().getId());
        dto.setStatus(booking.getStatus());
        dto.setCancelledAt(booking.getCancelledAt());
        dto.setAttendedAt(booking.getAttendedAt());
        dto.setCompletedAt(booking.getAttendedAt());
        dto.setBookedAt(booking.getCreatedAt());
        return dto;
    }
}