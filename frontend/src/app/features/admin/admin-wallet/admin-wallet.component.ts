import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-wallet.component.html',
  styleUrls: ['./admin-wallet.component.css']
})
export class AdminWalletComponent implements OnInit {
  memberId: number | null = null;
  amount: number | null = null;
  reference = '';
  transactions: any[] = [];
  message: string | null = null;

  constructor(private wallet: WalletService) {}

  ngOnInit(): void {}

  loadTransactions() {
    if (!this.memberId) return;
    this.wallet.adminGetTransactions(this.memberId).subscribe({
      next: (txs) => { this.transactions = txs; },
      error: () => { this.transactions = []; }
    });
  }

  topUp() {
    if (!this.memberId || this.amount == null) return;
    this.wallet.adminTopUp(this.memberId, this.amount, this.reference).subscribe({
      next: () => { this.message = 'Top-up successful'; this.loadTransactions(); },
      error: () => { this.message = 'Top-up failed'; }
    });
  }

  setBalance() {
    if (!this.memberId || this.amount == null) return;
    this.wallet.adminSetBalance(this.memberId, this.amount, this.reference).subscribe({
      next: () => { this.message = 'Balance set'; this.loadTransactions(); },
      error: () => { this.message = 'Set failed'; }
    });
  }
}
