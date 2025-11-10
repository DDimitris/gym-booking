package com.gym.booking.dto;

import java.math.BigDecimal;

public class BillingSummaryDTO {
    private Long userId;
    private BigDecimal totalOwed;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getTotalOwed() {
        return totalOwed;
    }

    public void setTotalOwed(BigDecimal totalOwed) {
        this.totalOwed = totalOwed;
    }
}
