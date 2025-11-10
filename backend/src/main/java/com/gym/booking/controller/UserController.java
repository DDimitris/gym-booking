package com.gym.booking.controller;

import com.gym.booking.dto.UserDTO;
import com.gym.booking.dto.BillingSummaryDTO;
import com.gym.booking.service.BillingService;
import com.gym.booking.model.User;
import com.gym.booking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final BillingService billingService;

    public UserController(UserService userService, BillingService billingService) {
        this.userService = userService;
        this.billingService = billingService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMe(org.springframework.security.core.Authentication authentication) {
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            User user = userService.findOrCreateFromJwtClaims(claims);
            return ResponseEntity.ok(convertToDTO(user));
        }
        return ResponseEntity.status(401).build();
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMe(@Valid @RequestBody UserDTO userDTO,
            org.springframework.security.core.Authentication authentication) {
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            User current = userService.findOrCreateFromJwtClaims(claims);
            // Only allow updating name for now (email managed by IdP)
            current.setName(userDTO.getName());
            current.setAvatarUrl(userDTO.getAvatarUrl());
            User saved = userService.createUser(current);
            return ResponseEntity.ok(convertToDTO(saved));
        }
        return ResponseEntity.status(401).build();
    }

    @GetMapping("/me/billing")
    public ResponseEntity<BillingSummaryDTO> getMyBilling(
            org.springframework.security.core.Authentication authentication) {
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            User user = userService.findOrCreateFromJwtClaims(claims);
            java.math.BigDecimal total = billingService.calculateTotalOwed(user.getId());
            BillingSummaryDTO dto = new BillingSummaryDTO();
            dto.setUserId(user.getId());
            dto.setTotalOwed(total);
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.status(401).build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) {
        User user = convertToEntity(userDTO);
        User savedUser = userService.createUser(user);
        return ResponseEntity.ok(convertToDTO(savedUser));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserDTO userDTO) {
        User user = convertToEntity(userDTO);
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(convertToDTO(updatedUser));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    // Expose trainers list to any authenticated user so dialogs can populate
    // instructor selection
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/trainers")
    public ResponseEntity<List<UserDTO>> getAllTrainers() {
        List<User> trainers = userService.findAllTrainers();
        List<UserDTO> instructorDTOs = trainers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(instructorDTOs);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    @GetMapping("/members")
    public ResponseEntity<List<UserDTO>> getAllMembers() {
        List<User> members = userService.findAllMembers();
        List<UserDTO> athleteDTOs = members.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(athleteDTOs);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }

    private User convertToEntity(UserDTO dto) {
        User user = new User();
        user.setId(dto.getId());
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(dto.getRole());
        user.setAvatarUrl(dto.getAvatarUrl());
        return user;
    }
}