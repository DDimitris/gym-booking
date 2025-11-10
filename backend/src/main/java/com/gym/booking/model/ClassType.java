package com.gym.booking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "class_types")
@lombok.Getter
@lombok.Setter
@lombok.ToString(exclude = { "trainer" })
public class ClassType extends BaseEntity {

    @NotBlank
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private User trainer;

    @Column(nullable = false)
    private Boolean isActive = true;

}
