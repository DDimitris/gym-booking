package com.gym.booking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

@Entity
@Table(name = "users")
@lombok.Getter
@lombok.Setter
@lombok.ToString(exclude = {})
public class User extends BaseEntity {

    @Column(unique = true)
    private String keycloakId;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(length = 50)
    private String authProvider = "EMAIL"; // EMAIL, GOOGLE, FACEBOOK

    @Column
    private String oauthId;

    @Column(precision = 10, scale = 2)
    private BigDecimal baseCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal groupBaseCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal smallGroupBaseCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal personalBaseCost;

    @Column(precision = 10, scale = 2)
    private BigDecimal openGymBaseCost;

    @Column
    private Integer bonusDays = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "avatar_url")
    private String avatarUrl;

    public enum UserRole {
        ADMIN,
        TRAINER,
        MEMBER
    }

    public enum UserStatus {
        ACTIVE,
        SUSPENDED,
        DELETED
    }

}