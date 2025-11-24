package com.gym.booking.repository;

import com.gym.booking.model.User;
import com.gym.booking.model.User.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByKeycloakId(String keycloakId);

    Optional<User> findByEmail(String email);

    List<User> findByRole(UserRole role);

    boolean existsByEmail(String email);

    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name, String email);

    // Atomically debit if sufficient funds. Returns number of rows updated (1 =
    // success, 0 = insufficient funds)
    @Modifying
    @Transactional
    @Query("update User u set u.walletBalance = u.walletBalance - :amount where u.id = :userId and u.walletBalance >= :amount")
    int debitIfSufficient(@Param("userId") Long userId, @Param("amount") BigDecimal amount);

    // Atomically credit (top-up)
    @Modifying
    @Transactional
    @Query("update User u set u.walletBalance = u.walletBalance + :amount where u.id = :userId")
    int creditBalance(@Param("userId") Long userId, @Param("amount") BigDecimal amount);

    // Atomically set balance
    @Modifying
    @Transactional
    @Query("update User u set u.walletBalance = :newBalance where u.id = :userId")
    int setBalance(@Param("userId") Long userId, @Param("newBalance") BigDecimal newBalance);

    // Compare-and-set: set to newBalance only if current balance equals expected
    @Modifying
    @Transactional
    @Query("update User u set u.walletBalance = :newBalance where u.id = :userId and u.walletBalance = :expected")
    int compareAndSetBalance(@Param("userId") Long userId, @Param("expected") BigDecimal expected,
            @Param("newBalance") BigDecimal newBalance);

    // Decrement bonusDays by 1 if it's positive. Returns 1 if decremented, 0
    // otherwise.
    @Modifying
    @Transactional
    @Query("update User u set u.bonusDays = u.bonusDays - 1 where u.id = :userId and u.bonusDays > 0")
    int decrementBonusIfPositive(@Param("userId") Long userId);
}