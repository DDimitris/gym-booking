package com.gym.booking.service;

import com.gym.booking.model.User;
import com.gym.booking.model.User.UserRole;
import com.gym.booking.repository.UserRepository;
import com.gym.booking.exception.ResourceNotFoundException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User findByKeycloakId(String keycloakId) {
        return userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with keycloak ID: " + keycloakId));
    }

    public User createUser(@NonNull User user) {
        return userRepository.save(user);
    }

    public User updateUser(@NonNull Long id, @NonNull User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());

        return userRepository.save(user);
    }

    public void deleteUser(@NonNull Long id) {
        userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.deleteById(id);
    }

    public List<User> findAllTrainers() {
        return userRepository.findByRole(UserRole.TRAINER);
    }

    public List<User> findAllMembers() {
        return userRepository.findByRole(UserRole.MEMBER);
    }

    public boolean existsByEmail(@NonNull String email) {
        return userRepository.existsByEmail(email);
    }

    public User findById(@NonNull Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public Optional<User> findOptionalByEmail(@NonNull String email) {
        return userRepository.findByEmail(email);
    }

    public User findByEmail(@NonNull String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<User> searchByNameOrEmail(@NonNull String query) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q);
    }

    public User findOrCreateFromJwtClaims(@NonNull Map<String, Object> claims) {
        String sub = claims.getOrDefault("sub", "").toString();
        String email = (String) claims.getOrDefault("email", "");
        String preferred = (String) claims.getOrDefault("preferred_username", "");
        String given = (String) claims.getOrDefault("given_name", "");
        String family = (String) claims.getOrDefault("family_name", "");
        String name = (String) claims.getOrDefault("name", "");

        // Extract roles from Keycloak token (realm_access.roles and top-level roles
        // claim)
        java.util.Set<String> rawRoles = new java.util.LinkedHashSet<>();
        Object realmAccess = claims.get("realm_access");
        if (realmAccess instanceof java.util.Map<?, ?> realm) {
            Object rolesObj = realm.get("roles");
            if (rolesObj instanceof java.util.Collection<?> roles) {
                for (Object r : roles) {
                    if (r != null)
                        rawRoles.add(String.valueOf(r));
                }
            }
        }
        Object directRoles = claims.get("roles");
        if (directRoles instanceof java.util.Collection<?> roles) {
            for (Object r : roles) {
                if (r != null)
                    rawRoles.add(String.valueOf(r));
            }
        }

        // Normalize legacy roles to new ones (INSTRUCTOR -> TRAINER, ATHLETE -> MEMBER)
        java.util.Set<String> normalized = new java.util.LinkedHashSet<>();
        for (String r : rawRoles) {
            String role = r.toUpperCase();
            if ("INSTRUCTOR".equals(role))
                role = "TRAINER";
            if ("ATHLETE".equals(role))
                role = "MEMBER";
            normalized.add(role);
        }

        // Determine highest precedence role for persistence (ADMIN > TRAINER > MEMBER)
        UserRole resolvedRole = UserRole.MEMBER;
        if (normalized.contains("ADMIN")) {
            resolvedRole = UserRole.ADMIN;
        } else if (normalized.contains("TRAINER")) {
            resolvedRole = UserRole.TRAINER;
        } else if (normalized.contains("MEMBER")) {
            resolvedRole = UserRole.MEMBER;
        }

        if (email == null || email.isBlank()) {
            // Fallback: construct a pseudo-email if none provided
            email = (preferred != null && !preferred.isBlank()) ? preferred + "@example.local"
                    : (sub + "@example.local");
        }
        if (name == null || name.isBlank()) {
            name = (given != null ? given : "").concat(" ").concat(family != null ? family : "").trim();
            if (name.isBlank())
                name = preferred != null && !preferred.isBlank() ? preferred : email;
        }

        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User u = existing.get();
            if (u.getKeycloakId() == null || u.getKeycloakId().isBlank()) {
                u.setKeycloakId(sub);
            }
            if (u.getName() == null || u.getName().isBlank()) {
                u.setName(name);
            }
            // Sync role if token indicates higher privilege (never downgrade ADMIN)
            if (u.getRole() != UserRole.ADMIN) {
                if (resolvedRole == UserRole.ADMIN || resolvedRole == UserRole.TRAINER) {
                    u.setRole(resolvedRole);
                } else if (u.getRole() == null) {
                    u.setRole(resolvedRole);
                }
            }
            return userRepository.save(u);
        }

        User user = new User();
        user.setKeycloakId(sub);
        user.setEmail(email);
        user.setName(name);
        user.setRole(resolvedRole); // default based on token (MEMBER if none)
        user.setAuthProvider("KEYCLOAK");
        return userRepository.save(user);
    }
}