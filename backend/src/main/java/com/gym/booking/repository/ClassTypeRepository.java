package com.gym.booking.repository;

import com.gym.booking.model.ClassType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassTypeRepository extends JpaRepository<ClassType, Long> {
    Optional<ClassType> findByName(String name);

    List<ClassType> findByIsActiveTrue();
}
