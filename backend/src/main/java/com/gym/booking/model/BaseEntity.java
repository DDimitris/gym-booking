package com.gym.booking.model;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.time.LocalDateTime;
import java.time.ZoneId;
import jakarta.persistence.Column;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

@MappedSuperclass
@lombok.Getter
@lombok.Setter
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        // Use application timezone (read from system property set at startup)
        String tz = System.getProperty("user.timezone", "Europe/Athens");
        createdAt = LocalDateTime.now(ZoneId.of(tz));
    }

    @PreUpdate
    protected void onUpdate() {
        String tz = System.getProperty("user.timezone", "Europe/Athens");
        updatedAt = LocalDateTime.now(ZoneId.of(tz));
    }
}