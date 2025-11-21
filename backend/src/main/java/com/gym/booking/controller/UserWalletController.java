package com.gym.booking.controller;

import com.gym.booking.model.WalletTransaction;
import com.gym.booking.model.User;
import com.gym.booking.service.UserService;
import com.gym.booking.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/users/me/wallet")
public class UserWalletController {
    private final WalletService walletService;
    private final UserService userService;

    public UserWalletController(WalletService walletService, UserService userService) {
        this.walletService = walletService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserWalletResponse> getMyWallet(org.springframework.security.core.Authentication authentication) {
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            java.util.Map<String, Object> claims = new java.util.HashMap<>(jwtAuth.getToken().getClaims());
            User user = userService.findOrCreateFromJwtClaims(claims);
            BigDecimal balance = walletService.getBalance(user.getId());
            List<WalletTransaction> txs = walletService.getTransactions(user.getId());
            UserWalletResponse resp = new UserWalletResponse();
            resp.balance = balance;
            resp.transactions = txs;
            return ResponseEntity.ok(resp);
        }
        return ResponseEntity.status(401).build();
    }

    public static class UserWalletResponse {
        public BigDecimal balance;
        public List<WalletTransaction> transactions;
    }
}
