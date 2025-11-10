package com.gym.booking.service;

import com.gym.booking.model.ClassType;
import com.gym.booking.model.User;
import com.gym.booking.repository.ClassTypeRepository;
import com.gym.booking.repository.GymClassRepository;
import com.gym.booking.exception.ResourceNotFoundException;
import org.springframework.lang.NonNull;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClassTypeService {
    private final ClassTypeRepository classTypeRepository;
    private final UserService userService;
    private final GymClassRepository gymClassRepository;

    public ClassTypeService(ClassTypeRepository classTypeRepository,
            UserService userService,
            GymClassRepository gymClassRepository) {
        this.classTypeRepository = classTypeRepository;
        this.userService = userService;
        this.gymClassRepository = gymClassRepository;
    }

    public ClassType createClassType(@NonNull ClassType classType, Long instructorId) {
        if (instructorId != null) {
            User instructor = userService.findById(instructorId);
            if (instructor.getRole() != User.UserRole.TRAINER) {
                throw new IllegalArgumentException("Only trainers can be assigned to a class type");
            }
            classType.setInstructor(instructor);
        }
        classType.setIsActive(true);
        return classTypeRepository.save(classType);
    }

    public ClassType updateClassType(@NonNull Long id, @NonNull ClassType classTypeDetails) {
        ClassType classType = findById(id);
        classType.setName(classTypeDetails.getName());
        classType.setDescription(classTypeDetails.getDescription());
        if (classTypeDetails.getIsActive() != null) {
            classType.setIsActive(classTypeDetails.getIsActive());
        }
        return classTypeRepository.save(classType);
    }

    public void deleteClassType(@NonNull Long id) {
        ClassType classType = findById(id);
        long referencing = gymClassRepository.countByClassType_Id(id);
        if (referencing > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete class type; " + referencing + " class(es) still reference it.");
        }
        classTypeRepository.delete(Objects.requireNonNull(classType)); // Hard delete
    }

    public List<ClassType> findAll() {
        return classTypeRepository.findAll();
    }

    public List<ClassType> findActiveClassTypes() {
        return classTypeRepository.findByIsActiveTrue();
    }

    public List<ClassType> findByInstructor(@NonNull Long instructorId) {
        User instructor = userService.findById(instructorId);
        return classTypeRepository.findByInstructor(instructor);
    }

    public ClassType findById(@NonNull Long id) {
        return classTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class type not found with id: " + id));
    }

    public ClassType findByName(String name) {
        return classTypeRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Class type not found with name: " + name));
    }
}
