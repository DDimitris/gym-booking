package com.gym.booking.controller;

import com.gym.booking.dto.GymClassDTO;
import com.gym.booking.model.GymClass;
import com.gym.booking.service.GymClassService;
import com.gym.booking.service.ClassTypeService;
import com.gym.booking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/classes")
public class GymClassController {
    private final GymClassService gymClassService;
    private final ClassTypeService classTypeService;
    private final UserService userService;

    public GymClassController(GymClassService gymClassService, ClassTypeService classTypeService,
            UserService userService) {
        this.gymClassService = gymClassService;
        this.classTypeService = classTypeService;
        this.userService = userService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<GymClassDTO> createGymClass(@Valid @RequestBody GymClassDTO gymClassDTO,
            org.springframework.security.core.Authentication authentication) {
        // Authorize based on persisted role of current user (works even if token lacks
        // role claims)
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            com.gym.booking.model.User me = userService.findOrCreateFromJwtClaims(claims);
            if (me.getRole() != com.gym.booking.model.User.UserRole.ADMIN
                    && me.getRole() != com.gym.booking.model.User.UserRole.TRAINER) {
                return ResponseEntity.status(403).build();
            }
        }
        GymClass gymClass = convertToEntity(gymClassDTO);
        GymClass savedClass = gymClassService.createGymClass(java.util.Objects.requireNonNull(gymClass),
                java.util.Objects.requireNonNull(gymClassDTO.getTrainerId()));
        return ResponseEntity.ok(convertToDTO(savedClass));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER')")
    @PutMapping("/{id}")
    public ResponseEntity<GymClassDTO> updateGymClass(@PathVariable Long id,
            @Valid @RequestBody GymClassDTO gymClassDTO) {
        GymClass gymClass = convertToEntity(gymClassDTO);
        GymClass updatedClass = gymClassService.updateGymClass(java.util.Objects.requireNonNull(id),
                java.util.Objects.requireNonNull(gymClass));
        return ResponseEntity.ok(convertToDTO(updatedClass));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGymClass(@PathVariable Long id) {
        gymClassService.deleteGymClass(java.util.Objects.requireNonNull(id));
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("permitAll()")
    @GetMapping
    public ResponseEntity<List<GymClassDTO>> getAllGymClasses() {
        List<GymClass> classes = gymClassService.findAll();
        List<GymClassDTO> classDTOs = classes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(classDTOs);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER')")
    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<List<GymClassDTO>> getGymClassesByTrainer(@PathVariable Long trainerId) {
        List<GymClass> classes = gymClassService.findByTrainer(java.util.Objects.requireNonNull(trainerId));
        List<GymClassDTO> classDTOs = classes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(classDTOs);
    }

    // Backward-compatibility alias (to be removed after UI migration)
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAINER')")
    @GetMapping("/instructor/{instructorId}")
    public ResponseEntity<List<GymClassDTO>> getGymClassesByInstructor(@PathVariable Long instructorId) {
        return getGymClassesByTrainer(instructorId);
    }

    // Removed search endpoint - use class types to filter instead

    private GymClassDTO convertToDTO(GymClass gymClass) {
        GymClassDTO dto = new GymClassDTO();
        dto.setId(gymClass.getId());
        dto.setName(gymClass.getName());
        dto.setDescription(gymClass.getDescription());
        dto.setCapacity(gymClass.getCapacity());
        dto.setDurationMinutes(gymClass.getDurationMinutes());
        dto.setTrainerId(gymClass.getTrainer() != null ? gymClass.getTrainer().getId() : null);
        dto.setClassTypeId(gymClass.getClassType() != null ? gymClass.getClassType().getId() : null);
        dto.setStatus(gymClass.getStatus() != null ? gymClass.getStatus().name() : "SCHEDULED");
        dto.setStartTime(gymClass.getStartTime());
        dto.setEndTime(gymClass.getEndTime());
        dto.setLocation(gymClass.getLocation());
        return dto;
    }

    private GymClass convertToEntity(GymClassDTO dto) {
        GymClass gymClass = new GymClass();
        gymClass.setId(dto.getId());
        // Name is derived from ClassType, not set directly
        gymClass.setDescription(dto.getDescription());
        gymClass.setCapacity(dto.getCapacity());
        gymClass.setDurationMinutes(dto.getDurationMinutes());
        gymClass.setStartTime(dto.getStartTime());
        gymClass.setEndTime(dto.getEndTime());
        gymClass.setLocation(dto.getLocation());
        if (dto.getClassTypeId() != null) {
            gymClass.setClassType(classTypeService.findById(java.util.Objects.requireNonNull(dto.getClassTypeId())));
        }
        return gymClass;
    }
}