package com.gym.booking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_instances")
@lombok.Getter
@lombok.Setter
@lombok.ToString(exclude = { "classType", "trainer" })
public class GymClass extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_type_id")
    private ClassType classType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Positive
    @Column(nullable = false)
    private Integer capacity = 5; // Default capacity per spec

    @NotNull
    @Column(nullable = false)
    private Integer durationMinutes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;

    @Column
    private LocalDateTime startTime;

    @Column
    private LocalDateTime endTime;

    @Column
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ClassStatus status = ClassStatus.SCHEDULED;

    @Column
    private Boolean isCancelled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 32)
    private ClassKind kind = ClassKind.GROUP;

    public enum ClassStatus {
        SCHEDULED,
        CANCELLED,
        COMPLETED
    }

    public enum ClassKind {
        GROUP,
        SMALL_GROUP,
        PERSONAL,
        OPEN_GYM
    }

    // Derived field: name comes from ClassType
    @Transient
    public String getName() {
        return classType != null ? classType.getName() : null;
    }

    public Boolean getIsCancelled() {
        return isCancelled;
    }

    public boolean isCancelled() {
        return Boolean.TRUE.equals(isCancelled);
    }

    public void setIsCancelled(Boolean isCancelled) {
        this.isCancelled = isCancelled;
    }
}