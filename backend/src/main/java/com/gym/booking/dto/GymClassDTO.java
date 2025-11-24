package com.gym.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GymClassDTO {
    private Long id;

    @NotBlank
    private String name; // Derived from ClassType

    private String description;

    @NotNull
    @Positive
    private Integer capacity;

    @NotNull
    @Positive
    private Integer durationMinutes;

    @NotNull
    // Renamed from instructorId -> trainerId for consistency
    private Long trainerId;

    // Optional for create; returned in responses for filtering
    private Long classTypeId;

    // Status returned to clients (SCHEDULED/CANCELLED/COMPLETED)
    private String status;

    // Class kind: GROUP, SMALL_GROUP, PERSONAL, OPEN_GYM
    private String kind;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
}