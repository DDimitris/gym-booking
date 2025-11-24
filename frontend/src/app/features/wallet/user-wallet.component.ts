import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService, UserWalletResponse, WalletTransaction } from '../../core/services/wallet.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-wallet',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-wallet.component.html',
  styleUrls: ['./user-wallet.component.css']
})
export class UserWalletComponent implements OnInit {
  loading = false;
  balance: number | null = null;
  transactions: WalletTransaction[] = [];
  error: string | null = null;
  showTopUp = false;

  constructor(private wallet: WalletService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.wallet.getMyWallet().subscribe({
      next: (res: UserWalletResponse) => {
        this.balance = res.balance;
        this.transactions = res.transactions || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load wallet';
        this.loading = false;
      }
    });
  }

  toggleTopUp(): void {
    this.showTopUp = !this.showTopUp;
  }
}
