import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { OnDestroy } from '@angular/core';

type UserRole = 'ADMIN' | 'TRAINER' | 'MEMBER';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

interface UserMe {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bonusDays?: number | null;
  walletBalance?: number | null;
  groupBaseCost?: number | null;
  smallGroupBaseCost?: number | null;
  personalBaseCost?: number | null;
  openGymBaseCost?: number | null;
  role: UserRole;
  status?: UserStatus | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  me: UserMe | null = null;
  message: string | null = null; // Keeping message for informational purposes
  messageType: 'success' | 'error' | 'info' = 'info'; // Keeping messageType for informational purposes
  subscription: any = null;
  subscriptionHistory: any[] = [];

  get daysRemaining(): number | null {
    if (!this.subscription || !this.subscription.endDate) {
      return null;
    }
    const end = new Date(this.subscription.endDate);
    const diffMs = end.getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  parseHistoryEventData(eventData: string | null): { key: string; value: string }[] {
    if (!eventData) return [];
    const parts = eventData.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const parsed: { key: string; value: string }[] = [];
    let anyKv = false;
    for (const p of parts) {
      const idx = p.indexOf('=');
      if (idx > 0) {
        anyKv = true;
        const k = p.substring(0, idx).trim();
        const v = p.substring(idx + 1).trim();
        parsed.push({ key: k, value: v });
      }
    }
    if (!anyKv) {
      return [{ key: 'data', value: eventData }];
    }
    return parsed;
  }

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.userService.getMe().subscribe({
      next: (me: UserMe) => { this.me = me; },
      error: () => { this.message = 'Failed to load profile'; this.messageType = 'error'; }
    });
    // Load subscription info for this member
    this.userService.getMySubscription().subscribe({
      next: (s) => { this.subscription = s; },
      error: () => { this.subscription = null; }
    });
    this.userService.getMySubscriptionHistory().subscribe({
      next: (h) => { this.subscriptionHistory = h || []; },
      error: () => { this.subscriptionHistory = []; }
    });
    // 'owed' concept removed; wallet balance is part of the user payload (me.walletBalance)
  }

  // Profile page is read-only for now; no save/edit actions.

  get isMember(): boolean {
    return this.me?.role === 'MEMBER';
  }

  get isTrainer(): boolean {
    return this.me?.role === 'TRAINER';
  }

  get isAdmin(): boolean {
    return this.me?.role === 'ADMIN';
  }
}
