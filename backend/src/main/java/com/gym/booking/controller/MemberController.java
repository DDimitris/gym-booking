package com.gym.booking.controller;

import com.gym.booking.model.Subscription;
import com.gym.booking.service.SubscriptionService;
import com.gym.booking.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {
    private final UserService userService;
    private final SubscriptionService subscriptionService;

    public MemberController(UserService userService, SubscriptionService subscriptionService) {
        this.userService = userService;
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/me/subscription")
    public ResponseEntity<?> getMySubscription(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwt)) {
            return ResponseEntity.status(401).build();
        }
        java.util.Map<String, Object> claims = new java.util.HashMap<>(jwt.getToken().getClaims());
        var user = userService.findOrCreateFromJwtClaims(claims);
        return subscriptionService.getActiveByUser(user.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/me/subscription/history")
    public ResponseEntity<List<?>> getMySubscriptionHistory(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwt)) {
            return ResponseEntity.status(401).build();
        }
        java.util.Map<String, Object> claims = new java.util.HashMap<>(jwt.getToken().getClaims());
        var user = userService.findOrCreateFromJwtClaims(claims);
        return ResponseEntity.ok(subscriptionService.getHistory(user.getId()));
    }
}
