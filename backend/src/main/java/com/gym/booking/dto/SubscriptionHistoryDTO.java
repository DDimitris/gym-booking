package com.gym.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SubscriptionHistoryDTO {
    private Long subscriptionId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal initialPayment;
    private int classesCompleted;
    private String endReason;

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
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

    public BigDecimal getInitialPayment() {
        return initialPayment;
    }

    public void setInitialPayment(BigDecimal initialPayment) {
        this.initialPayment = initialPayment;
    }

    public int getClassesCompleted() {
        return classesCompleted;
    }

    public void setClassesCompleted(int classesCompleted) {
        this.classesCompleted = classesCompleted;
    }

    public String getEndReason() {
        return endReason;
    }

    public void setEndReason(String endReason) {
        this.endReason = endReason;
    }
}
