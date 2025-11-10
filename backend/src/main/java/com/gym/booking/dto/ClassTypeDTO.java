package com.gym.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassTypeDTO {
    private Long id;

    @NotBlank
    private String name;

    private String description;

    // Renamed from instructorId -> trainerId for consistency
    private Long trainerId;

    private Boolean isActive;
}
