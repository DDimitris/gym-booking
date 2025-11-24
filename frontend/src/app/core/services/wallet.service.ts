import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WalletTransaction {
  id?: number;
  amount: number;
  type: string;
  reference?: string | null;
  createdAt?: string;
}

export interface UserWalletResponse {
  balance: number;
  transactions: WalletTransaction[];
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private base = `${environment.apiUrl}`;
  constructor(private http: HttpClient) {}

  getMyWallet(): Observable<UserWalletResponse> {
    return this.http.get<UserWalletResponse>(`${this.base}/users/me/wallet`);
  }

  // Admin
  adminTopUp(memberId: number, amount: number, reference?: string) {
    return this.http.post(`${this.base}/admin/members/${memberId}/wallet/topup`, { amount, reference });
  }

  adminSetBalance(memberId: number, amount: number, reference?: string) {
    return this.http.post(`${this.base}/admin/members/${memberId}/wallet/set`, { amount, reference });
  }

  adminGetTransactions(memberId: number) {
    return this.http.get<WalletTransaction[]>(`${this.base}/admin/members/${memberId}/wallet/transactions`);
  }
}
