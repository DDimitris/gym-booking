import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, TestUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="app-header">
      <div class="brand">
        <a routerLink="/">🏋️ Gym Booking</a>
      </div>
      <div class="nav-links">
        <a routerLink="/classes" routerLinkActive="active">Classes</a>
      </div>
      <div class="auth">
        <ng-container *ngIf="currentUser; else anon">
          <span class="user-badge" [class]="'badge-' + currentUser.role.toLowerCase()">
            {{ currentUser.displayName }} ({{ currentUser.role }})
          </span>
          <button class="btn-logout" (click)="logout()">Logout</button>
        </ng-container>
        <ng-template #anon>
          <label for="quick-login">Quick login:</label>
          <select id="quick-login" (change)="loginAs($any($event.target).value)">
            <option value="">Choose user…</option>
            <option *ngFor="let u of users" [value]="u.username">
              {{ u.displayName }} — {{ u.role }}
            </option>
          </select>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .brand a {
      color: white;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand a:hover {
      opacity: 0.9;
    }

    .nav-links {
      display: flex;
      gap: 1rem;
    }

    .nav-links a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .nav-links a:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .nav-links a.active {
      background: rgba(255, 255, 255, 0.2);
      font-weight: 600;
    }

    .auth {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .user-badge {
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      display: inline-block;
    }

    .badge-admin {
      background: #d32f2f;
      color: white;
    }

    .badge-trainer {
      background: #1976d2;
      color: white;
    }

    .badge-member {
      background: #388e3c;
      color: white;
    }

    .btn-logout {
      background: #ffc107;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      color: #333;
      transition: background 0.2s;
    }

    .btn-logout:hover {
      background: #ffb300;
    }

    label {
      font-size: 0.9rem;
    }

    select {
      padding: 0.4rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
    }
  `]
})
export class HeaderComponent {
  users: TestUser[] = [];
  currentUser: TestUser | null = null;

  constructor(private auth: AuthService) {
    this.users = this.auth.getUsers();
    this.currentUser = this.auth.getUser();
    this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loginAs(username: string): void {
    if (username) {
      this.auth.loginAs(username);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}