import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';

interface UserMe {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  baseCost?: number;
  bonusDays?: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  me: UserMe | null = null;
  totalOwed: number | null = null;
  message: string | null = null;
  messageType: 'success' | 'error' | 'info' = 'info';

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

  save(): void {
    if (!this.me) return;
    this.userService.updateMe({ name: this.me.name, avatarUrl: this.me.avatarUrl }).subscribe({
      next: (updated: UserMe) => { this.me = { ...this.me!, ...updated }; this.messageType = 'success'; this.message = 'Saved'; },
      error: () => { this.messageType = 'error'; this.message = 'Save failed'; }
    });
  }
}
