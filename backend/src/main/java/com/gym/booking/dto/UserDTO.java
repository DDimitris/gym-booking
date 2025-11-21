package com.gym.booking.dto;

import com.gym.booking.model.User.UserRole;
import com.gym.booking.model.User.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotNull
    private UserRole role;

    private BigDecimal baseCost;

    private BigDecimal groupBaseCost;

    private BigDecimal smallGroupBaseCost;

    private BigDecimal personalBaseCost;

    private BigDecimal openGymBaseCost;
    private BigDecimal walletBalance;
    private Integer bonusDays;
    private UserStatus status;
    private String avatarUrl;
}