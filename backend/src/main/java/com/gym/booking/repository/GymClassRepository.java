package com.gym.booking.repository;

import com.gym.booking.model.GymClass;
import com.gym.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GymClassRepository extends JpaRepository<GymClass, Long> {
    List<GymClass> findByTrainer(User trainer);
    // Note: Cannot search by name directly as it's derived from ClassType

    long countByClassType_Id(Long classTypeId);

    long countByTrainer_Id(Long trainerId);
}