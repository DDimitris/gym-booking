package com.gym.booking.controller;

import com.gym.booking.dto.ScheduleDTO;
import com.gym.booking.model.Schedule;
import com.gym.booking.service.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {
    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ScheduleDTO> createSchedule(@Valid @RequestBody ScheduleDTO scheduleDTO) {
        Schedule schedule = scheduleService.createSchedule(scheduleDTO.getGymClassId(), scheduleDTO.getStartTime());
        return ResponseEntity.ok(convertToDTO(schedule));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSchedule(@PathVariable Long id) {
        scheduleService.cancelSchedule(id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER', 'INSTRUCTOR', 'MEMBER', 'ATHLETE')")
    @GetMapping
    public ResponseEntity<List<ScheduleDTO>> getSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Schedule> schedules = scheduleService.findByDateRange(start, end);
        List<ScheduleDTO> scheduleDTOs = schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(scheduleDTOs);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER', 'INSTRUCTOR')")
    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<List<ScheduleDTO>> getTrainerSchedules(
            @PathVariable Long trainerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Schedule> schedules = scheduleService.findByTrainerAndDateRange(trainerId, start, end);
        List<ScheduleDTO> scheduleDTOs = schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(scheduleDTOs);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER', 'INSTRUCTOR', 'MEMBER', 'ATHLETE')")
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ScheduleDTO>> getClassSchedules(@PathVariable Long classId) {
        List<Schedule> schedules = scheduleService.findByGymClass(classId);
        List<ScheduleDTO> scheduleDTOs = schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(scheduleDTOs);
    }

    private ScheduleDTO convertToDTO(Schedule schedule) {
        ScheduleDTO dto = new ScheduleDTO();
        dto.setId(schedule.getId());
        dto.setGymClassId(schedule.getGymClass().getId());
        dto.setStartTime(schedule.getStartTime());
        dto.setEndTime(schedule.getEndTime());
        dto.setCancelled(schedule.isCancelled());
        return dto;
    }
}