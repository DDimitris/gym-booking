package com.gym.booking.dto;

import com.gym.booking.model.Booking.BookingStatus;
import java.time.LocalDateTime;

public class BookingDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long classInstanceId;
    private BookingStatus status;
    private LocalDateTime cancelledAt;
    private LocalDateTime attendedAt;
    private LocalDateTime bookedAt;
    private LocalDateTime completedAt; // mirror of attendedAt for frontend convenience

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Long getClassInstanceId() {
        return classInstanceId;
    }

    public void setClassInstanceId(Long classInstanceId) {
        this.classInstanceId = classInstanceId;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public LocalDateTime getAttendedAt() {
        return attendedAt;
    }

    public void setAttendedAt(LocalDateTime attendedAt) {
        this.attendedAt = attendedAt;
    }

    public LocalDateTime getBookedAt() {
        return bookedAt;
    }

    public void setBookedAt(LocalDateTime bookedAt) {
        this.bookedAt = bookedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}