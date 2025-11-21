package com.gym.booking.service;

import com.gym.booking.model.Booking;
import com.gym.booking.model.WalletTransaction;
import java.math.BigDecimal;
import java.util.List;

public interface WalletService {
    record WalletChargeResult(boolean fullySettled, boolean bonusConsumed, BigDecimal chargedAmount) {}

    BigDecimal getBalance(Long userId);

    WalletTransaction topUp(Long userId, BigDecimal amount, String reference);

    WalletTransaction setBalance(Long userId, BigDecimal amount, String reference);

    WalletChargeResult chargeForBooking(Long userId, BigDecimal amount, Booking booking);

    List<WalletTransaction> getTransactions(Long userId);
}

