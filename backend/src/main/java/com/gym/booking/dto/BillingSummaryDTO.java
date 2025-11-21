package com.gym.booking.dto;

import java.math.BigDecimal;

public class BillingSummaryDTO {
    private Long userId;
    private BigDecimal placeholder; // removed totalOwed: retained field to keep DTO structure minimal

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public BigDecimal getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(BigDecimal placeholder) {
        this.placeholder = placeholder;
    }
}
