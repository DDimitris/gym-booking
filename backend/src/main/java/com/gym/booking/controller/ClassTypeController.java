package com.gym.booking.controller;

import com.gym.booking.dto.ClassTypeDTO;
import com.gym.booking.model.ClassType;
import com.gym.booking.service.ClassTypeService;
import com.gym.booking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/class-types")
public class ClassTypeController {
    private static final Logger log = LoggerFactory.getLogger(ClassTypeController.class);
    private final ClassTypeService classTypeService;
    private final UserService userService;

    public ClassTypeController(ClassTypeService classTypeService, UserService userService) {
        this.classTypeService = classTypeService;
        this.userService = userService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ClassTypeDTO> createClassType(@Valid @RequestBody ClassTypeDTO classTypeDTO,
            Authentication authentication) {
        // Authorize using persisted user role to avoid dependency on token authorities
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            com.gym.booking.model.User me = userService.findOrCreateFromJwtClaims(claims);
            if (me.getRole() != com.gym.booking.model.User.UserRole.ADMIN
                    && me.getRole() != com.gym.booking.model.User.UserRole.TRAINER) {
                if (log.isDebugEnabled()) {
                    String authorities = authentication.getAuthorities().stream()
                            .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                            .sorted()
                            .collect(java.util.stream.Collectors.joining(","));
                    log.debug("ClassTypeCreate denied auth=[{}] role=[{}]", authorities, me.getRole());
                }
                return ResponseEntity.status(403).build();
            }
        }
        ClassType classType = convertToEntity(classTypeDTO);
        ClassType savedClassType = classTypeService.createClassType(Objects.requireNonNull(classType),
                classTypeDTO.getInstructorId());
        return ResponseEntity.ok(convertToDTO(savedClassType));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    public ResponseEntity<ClassTypeDTO> updateClassType(@PathVariable @NonNull Long id,
            @Valid @RequestBody ClassTypeDTO classTypeDTO, Authentication authentication) {
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            com.gym.booking.model.User me = userService.findOrCreateFromJwtClaims(claims);
            if (me.getRole() != com.gym.booking.model.User.UserRole.ADMIN
                    && me.getRole() != com.gym.booking.model.User.UserRole.TRAINER) {
                return ResponseEntity.status(403).build();
            }
        }
        ClassType classType = convertToEntity(classTypeDTO);
        ClassType updatedClassType = classTypeService.updateClassType(Objects.requireNonNull(id),
                Objects.requireNonNull(classType));
        return ResponseEntity.ok(convertToDTO(updatedClassType));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClassType(@PathVariable @NonNull Long id, Authentication authentication) {
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            com.gym.booking.model.User me = userService.findOrCreateFromJwtClaims(claims);
            if (me.getRole() != com.gym.booking.model.User.UserRole.ADMIN
                    && me.getRole() != com.gym.booking.model.User.UserRole.TRAINER) {
                return ResponseEntity.status(403).build();
            }
        }
        classTypeService.deleteClassType(Objects.requireNonNull(id));
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("permitAll()")
    @GetMapping
    public ResponseEntity<List<ClassTypeDTO>> getAllClassTypes() {
        List<ClassType> classTypes = classTypeService.findAll();
        List<ClassTypeDTO> classTypeDTOs = classTypes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(classTypeDTOs);
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/active")
    public ResponseEntity<List<ClassTypeDTO>> getActiveClassTypes() {
        List<ClassType> classTypes = classTypeService.findActiveClassTypes();
        List<ClassTypeDTO> classTypeDTOs = classTypes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(classTypeDTOs);
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/{id}")
    public ResponseEntity<ClassTypeDTO> getClassTypeById(@PathVariable @NonNull Long id) {
        ClassType classType = classTypeService.findById(Objects.requireNonNull(id));
        return ResponseEntity.ok(convertToDTO(classType));
    }

    private ClassTypeDTO convertToDTO(ClassType classType) {
        ClassTypeDTO dto = new ClassTypeDTO();
        dto.setId(classType.getId());
        dto.setName(classType.getName());
        dto.setDescription(classType.getDescription());
        dto.setInstructorId(classType.getInstructor() != null ? classType.getInstructor().getId() : null);
        dto.setIsActive(classType.getIsActive());
        return dto;
    }

    private ClassType convertToEntity(ClassTypeDTO dto) {
        ClassType classType = new ClassType();
        classType.setName(dto.getName());
        classType.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) {
            classType.setIsActive(dto.getIsActive());
        }
        return classType;
    }
}
