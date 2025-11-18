package com.gym.booking.controller;

import com.gym.booking.dto.BillingReportDTO;
import com.gym.booking.dto.UserDTO;
import com.gym.booking.model.BillingEvent;
import com.gym.booking.model.User;
import com.gym.booking.service.BillingService;
import com.gym.booking.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserService userService;
    private final BillingService billingService;
    private final com.gym.booking.repository.GymClassRepository gymClassRepository;

    public AdminController(UserService userService, BillingService billingService,
            com.gym.booking.repository.GymClassRepository gymClassRepository) {
        this.userService = userService;
        this.billingService = billingService;
        this.gymClassRepository = gymClassRepository;
    }

    @GetMapping("/members")
    public ResponseEntity<List<UserDTO>> getAllMembers() {
        List<User> members = userService.findAllMembers();
        List<UserDTO> memberDTOs = members.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(memberDTOs);
    }

    @PostMapping("/members/{userId}/base-cost")
    public ResponseEntity<UserDTO> setMemberBaseCost(
            @PathVariable("userId") long userId,
            @RequestParam("baseCost") BigDecimal baseCost) {
        User user = userService.findById(userId);
        user.setBaseCost(baseCost);
        User updated = userService.createUser(user);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    public static class MemberBaseCostsDTO {
        private BigDecimal groupBaseCost;
        private BigDecimal smallGroupBaseCost;
        private BigDecimal personalBaseCost;
        private BigDecimal openGymBaseCost;

        public BigDecimal getGroupBaseCost() {
            return groupBaseCost;
        }

        public void setGroupBaseCost(BigDecimal groupBaseCost) {
            this.groupBaseCost = groupBaseCost;
        }

        public BigDecimal getSmallGroupBaseCost() {
            return smallGroupBaseCost;
        }

        public void setSmallGroupBaseCost(BigDecimal smallGroupBaseCost) {
            this.smallGroupBaseCost = smallGroupBaseCost;
        }

        public BigDecimal getPersonalBaseCost() {
            return personalBaseCost;
        }

        public void setPersonalBaseCost(BigDecimal personalBaseCost) {
            this.personalBaseCost = personalBaseCost;
        }

        public BigDecimal getOpenGymBaseCost() {
            return openGymBaseCost;
        }

        public void setOpenGymBaseCost(BigDecimal openGymBaseCost) {
            this.openGymBaseCost = openGymBaseCost;
        }
    }

    @PostMapping("/members/{userId}/base-costs")
    public ResponseEntity<UserDTO> setMemberBaseCosts(
            @PathVariable("userId") long userId,
            @RequestBody MemberBaseCostsDTO costs) {
        User user = userService.findById(userId);
        if (costs.getGroupBaseCost() != null) {
            user.setGroupBaseCost(costs.getGroupBaseCost());
        }
        if (costs.getSmallGroupBaseCost() != null) {
            user.setSmallGroupBaseCost(costs.getSmallGroupBaseCost());
        }
        if (costs.getPersonalBaseCost() != null) {
            user.setPersonalBaseCost(costs.getPersonalBaseCost());
        }
        if (costs.getOpenGymBaseCost() != null) {
            user.setOpenGymBaseCost(costs.getOpenGymBaseCost());
        }
        User updated = userService.createUser(user);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    @PostMapping("/members/{userId}/bonus-days")
    public ResponseEntity<UserDTO> setMemberBonusDays(
            @PathVariable("userId") long userId,
            @RequestParam("bonusDays") Integer bonusDays) {
        User user = userService.findById(userId);
        user.setBonusDays(bonusDays);
        User updated = userService.createUser(user);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    @PostMapping("/members/{userId}/promote-to-trainer")
    public ResponseEntity<UserDTO> promoteToTrainer(@PathVariable("userId") long userId) {
        User user = userService.findById(userId);
        user.setRole(User.UserRole.TRAINER);
        User updated = userService.createUser(user);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable("userId") long userId) {
        User user = userService.findById(userId);
        if (user.getRole() == User.UserRole.ADMIN) {
            return ResponseEntity.badRequest().body("Cannot delete admin user");
        }
        if (user.getRole() == User.UserRole.TRAINER) {
            long referencing = gymClassRepository.countByTrainer_Id(userId);
            if (referencing > 0) {
                return ResponseEntity.badRequest()
                        .body("Cannot delete trainer: " + referencing + " class(es) still reference this trainer.");
            }
        }
        userService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/billing/member/{userId}")
    public ResponseEntity<BillingReportDTO> getMemberBillingReport(
            @PathVariable("userId") long userId,
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr) {

        LocalDateTime startDate = parseStartDate(startDateStr);
        LocalDateTime endDate = parseEndDate(endDateStr);
        List<BillingEvent> events = billingService.getUserEventsForDateRange(userId, startDate, endDate);
        BigDecimal totalOwed = billingService.calculateTotalOwed(userId);
        User user = userService.findById(userId);

        BillingReportDTO report = new BillingReportDTO();
    report.setUserId(userId);
    report.setUserName(user.getName());
        report.setBonusDays(user.getBonusDays());
        report.setTotalOwed(totalOwed);
        report.setEvents(events.stream()
                .map(this::convertBillingEventToSimpleDTO)
                .collect(Collectors.toList()));

        return ResponseEntity.ok(report);
    }

    @GetMapping("/billing/all")
    public ResponseEntity<List<BillingReportDTO>> getAllBillingEvents(
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr) {
        LocalDateTime startDate = parseStartDate(startDateStr);
        LocalDateTime endDate = parseEndDate(endDateStr);
        // Aggregate per member to match frontend AdminBilling view
        List<User> members = userService.findAllMembers();
        List<BillingReportDTO> reports = members.stream().map(user -> {
            List<BillingEvent> events = billingService.getUserEventsForDateRange(user.getId(), startDate, endDate);
            BillingReportDTO dto = new BillingReportDTO();
            dto.setUserId(user.getId());
            dto.setUserName(user.getName());
            dto.setBonusDays(user.getBonusDays());
            dto.setTotalOwed(billingService.calculateTotalOwed(user.getId()));
            dto.setEvents(events.stream()
                    .map(this::convertBillingEventToSimpleDTO)
                    .collect(Collectors.toList()));
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(reports);
    }

    @PostMapping("/billing/settle")
    public ResponseEntity<?> settleBillingEvents(@RequestBody List<Long> eventIds) {
        billingService.markAsSettledBulk(eventIds);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/billing/events/{eventId}/settle/payment")
    public ResponseEntity<?> settleBillingEventAsPayment(@PathVariable("eventId") Long eventId) {
        billingService.settleAsPayment(eventId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/billing/events/{eventId}/settle/bonus")
    public ResponseEntity<?> settleBillingEventAsBonus(@PathVariable("eventId") Long eventId) {
        try {
            billingService.settleAsBonus(eventId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/trainers")
    public ResponseEntity<List<UserDTO>> getAllTrainers() {
        List<User> trainers = userService.findAllTrainers();
        List<UserDTO> instructorDTOs = trainers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(instructorDTOs);
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam("query") String query) {
        if (query == null)
            query = ""; // defensive
        List<User> users = userService.searchByNameOrEmail(query);
        List<UserDTO> dtos = users.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private LocalDateTime parseStartDate(String value) {
        // Accept either YYYY-MM-DD or ISO date-time; expand to start of day if
        // date-only
        if (value == null)
            return null;
        if (value.length() == 10) { // YYYY-MM-DD
            return LocalDateTime.parse(value + "T00:00:00");
        }
        return LocalDateTime.parse(value);
    }

    private LocalDateTime parseEndDate(String value) {
        if (value == null)
            return null;
        if (value.length() == 10) {
            return LocalDateTime.parse(value + "T23:59:59");
        }
        return LocalDateTime.parse(value);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setBaseCost(user.getBaseCost());
        dto.setGroupBaseCost(user.getGroupBaseCost());
        dto.setSmallGroupBaseCost(user.getSmallGroupBaseCost());
        dto.setPersonalBaseCost(user.getPersonalBaseCost());
        dto.setOpenGymBaseCost(user.getOpenGymBaseCost());
        dto.setBonusDays(user.getBonusDays());
        dto.setStatus(user.getStatus());
        return dto;
    }

    private BillingReportDTO.BillingEventSummary convertBillingEventToSimpleDTO(BillingEvent event) {
        BillingReportDTO.BillingEventSummary summary = new BillingReportDTO.BillingEventSummary();
        summary.setId(event.getId());
        if (event.getBooking() != null) {
            summary.setBookingId(event.getBooking().getId());
            if (event.getBooking().getClassInstance() != null) {
                summary.setClassName(event.getBooking().getClassInstance().getName());
                if (event.getBooking().getClassInstance().getKind() != null) {
                    summary.setClassKind(event.getBooking().getClassInstance().getKind().name());
                }
                if (event.getBooking().getClassInstance().getTrainer() != null) {
                    summary.setInstructorName(event.getBooking().getClassInstance().getTrainer().getName());
                }
            }
        }
        summary.setAmount(event.getAmount());
        summary.setReason(event.getReason());
        summary.setEventDate(event.getEventDate());
        summary.setSettled(event.isSettled());
        summary.setSettlementType(event.getSettlementType());
        return summary;
    }
}
