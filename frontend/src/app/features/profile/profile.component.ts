import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { TranslateModule } from '@ngx-translate/core';

type UserRole = 'ADMIN' | 'TRAINER' | 'MEMBER';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

interface UserMe {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bonusDays?: number | null;
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
  totalOwed: number | null = null;
  message: string | null = null; // Keeping message for informational purposes
  messageType: 'success' | 'error' | 'info' = 'info'; // Keeping messageType for informational purposes

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.userService.getMe().subscribe({
      next: (me: UserMe) => { this.me = me; },
      error: () => { this.message = 'Failed to load profile'; this.messageType = 'error'; }
    });
    this.userService.getMyBillingSummary().subscribe({
      next: (sum: { totalOwed: number }) => { this.totalOwed = sum.totalOwed; },
      error: () => { /* non-blocking */ }
    });
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
