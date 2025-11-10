package com.gym.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class BillingReportDTO {
    private Long userId;
    private String userName;
    private BigDecimal baseCost;
    private Integer bonusDays;
    private BigDecimal totalOwed;
    private List<BillingEventSummary> events;

    public static class BillingEventSummary {
        private Long id;
        private BigDecimal amount;
        private String reason;
        private LocalDateTime eventDate;
        private Boolean settled;

        // Getters and Setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
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

        public void setSettled(Boolean settled) {
            this.settled = settled;
        }
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public BigDecimal getBaseCost() {
        return baseCost;
    }

    public void setBaseCost(BigDecimal baseCost) {
        this.baseCost = baseCost;
    }

    public Integer getBonusDays() {
        return bonusDays;
    }

    public void setBonusDays(Integer bonusDays) {
        this.bonusDays = bonusDays;
    }

    public BigDecimal getTotalOwed() {
        return totalOwed;
    }

    public void setTotalOwed(BigDecimal totalOwed) {
        this.totalOwed = totalOwed;
    }

    public List<BillingEventSummary> getEvents() {
        return events;
    }

    public void setEvents(List<BillingEventSummary> events) {
        this.events = events;
    }
}
