package com.gym.booking.controller;

import com.gym.booking.model.WalletTransaction;
import com.gym.booking.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/members/{id}/wallet")
@PreAuthorize("hasRole('ADMIN')")
public class AdminWalletController {
    private final WalletService walletService;

    public AdminWalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping("/topup")
    public ResponseEntity<WalletTransaction> topUp(@PathVariable Long id, @RequestBody TopUpRequest req) {
        WalletTransaction tx = walletService.topUp(id, req.amount, req.reference);
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/set")
    public ResponseEntity<WalletTransaction> set(@PathVariable Long id, @RequestBody TopUpRequest req) {
        WalletTransaction tx = walletService.setBalance(id, req.amount, req.reference);
        return ResponseEntity.ok(tx);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransaction>> transactions(@PathVariable Long id) {
        return ResponseEntity.ok(walletService.getTransactions(id));
    }

    public static class TopUpRequest {
        public BigDecimal amount;
        public String reference;
    }
}

