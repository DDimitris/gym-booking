package com.gym.booking.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "subscriptions")
public class Subscription extends BaseEntity {

    public enum Status {
        PENDING,
        ACTIVE,
        CANCELLED,
        EXPIRED
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "initial_payment", precision = 10, scale = 2, nullable = false)
    private BigDecimal initialPayment;

    @Column(nullable = false)
    private Integer months;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "late_cancellations")
    private Integer lateCancellations = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    // created_at and canceled_at handled by DB

    // Getters/Setters
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BigDecimal getInitialPayment() {
        return initialPayment;
    }

    public void setInitialPayment(BigDecimal initialPayment) {
        this.initialPayment = initialPayment;
    }

    public Integer getMonths() {
        return months;
    }

    public void setMonths(Integer months) {
        this.months = months;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getLateCancellations() {
        return lateCancellations;
    }

    public void setLateCancellations(Integer lateCancellations) {
        this.lateCancellations = lateCancellations;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
