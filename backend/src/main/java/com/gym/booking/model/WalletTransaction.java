package com.gym.booking.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
 
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wallet_transactions")
@Getter
@Setter
@NoArgsConstructor
public class WalletTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(length = 50, nullable = false)
    private String type; // TOPUP, SET, CHARGE, REFUND

    @Column(length = 255)
    private String reference;

    // createdAt/updatedAt are provided by BaseEntity

}
