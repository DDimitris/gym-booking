package com.gym.booking.repository;

import com.gym.booking.model.WalletTransaction;
import com.gym.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByUserOrderByCreatedAtDesc(User user);
}
