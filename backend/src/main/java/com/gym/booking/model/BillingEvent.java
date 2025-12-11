package com.gym.booking.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_events")
public class BillingEvent extends BaseEntity {

    public enum SettlementType {
        NONE,
        PAYMENT,
        BONUS,
        SUBSCRIPTION
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime eventDate;

    @Column(nullable = false)
    private Boolean settled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_type", length = 20)
    private SettlementType settlementType = SettlementType.NONE;

    // Getters and Setters
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDateTime eventDate) {
        this.eventDate = eventDate;
    }

    public Boolean getSettled() {
        return settled;
    }

    public boolean isSettled() {
        return Boolean.TRUE.equals(settled);
    }

    public void setSettled(Boolean settled) {
        this.settled = settled;
    }

    public SettlementType getSettlementType() {
        return settlementType;
    }

    public void setSettlementType(SettlementType settlementType) {
        this.settlementType = settlementType;
    }
}
