import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CalendarComponent } from './features/calendar/calendar.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeycloakService } from './core/services/keycloak.service';

// Start (landing) page for unauthenticated users
@Component({
  selector: 'app-start',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero container">
      <div class="hero-inner">
        <div class="copy">
          <h1>Book smarter. Train better.</h1>
          <p class="lead">Manage classes, track your history, and stay on top of your fitness goals.</p>
          <div class="actions">
            <button class="btn primary" (click)="login()">Login</button>
            <a class="btn ghost" href="#features">Learn more</a>
          </div>
        </div>
        <div class="art" aria-hidden="true">🏋️‍♀️</div>
      </div>
    </section>
    <section id="features" class="features container">
      <div class="grid">
        <div class="card pad">
          <h3>Fast booking</h3>
          <p>Find and reserve a spot in seconds with a clean calendar view.</p>
        </div>
        <div class="card pad">
          <h3>Clear history</h3>
          <p>See your past and upcoming classes at a glance.</p>
        </div>
        <div class="card pad">
          <h3>Trainer tools</h3>
          <p>Manage schedules and participants with confidence.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero { padding: 56px 0; }
    .hero-inner { display: grid; grid-template-columns: 1.2fr .8fr; gap: 24px; align-items: center; }
    .copy h1 { font-size: 44px; line-height: 1.05; margin: 0 0 12px; }
    .lead { color: var(--color-text-muted); margin: 0 0 20px; font-size: 18px; }
    .actions { display: flex; gap: 12px; }
    .art { font-size: 72px; text-align: center; }
    .features { padding: 20px 0 56px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 900px) { .hero-inner { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr; } }
  `]
})
class StartComponent implements OnInit {
  constructor(private router: Router, private kc: KeycloakService) {}
  ngOnInit(): void {
    // If already authenticated (e.g., return from Keycloak), go straight to classes
    if (this.kc.isReady() && this.kc.isAuthenticated()) {
      const roles = this.kc.getRoles();
      // Members land on history; staff land on classes/management
      if (roles.includes('ATHLETE') || roles.includes('MEMBER')) {
        this.router.navigate(['/history']);
      } else {
        this.router.navigate(['/classes']);
      }
    }
  }
  login(): void { this.kc.login(); }
}
import { ActivityHistoryComponent } from './features/activity-history/activity-history.component';
// TODO: Rename component & folder to admin-members; temporary import kept for transition
import { AdminAthletesComponent } from './features/admin/admin-athletes/admin-athletes.component';
import { AdminBillingComponent } from './features/admin/admin-billing/admin-billing.component';
// Removed standalone admin class routes; classes managed inside Management tabs
import { ManagementComponent } from './features/admin/management/management.component';
import { ProfileComponent } from './features/profile/profile.component';
import { UserWalletComponent } from './features/wallet/user-wallet.component';
import { AdminWalletComponent } from './features/admin/admin-wallet/admin-wallet.component';

export const routes: Routes = [
  {
    path: '',
    component: StartComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { authRequired: true }
  },
  {
    path: 'classes',
    component: CalendarComponent,
    canActivate: [AuthGuard],
    data: { authRequired: true }
  },
  {
    path: 'history',
    component: ActivityHistoryComponent,
    canActivate: [AuthGuard],
    data: { authRequired: true, roles: ['MEMBER', 'ATHLETE'] }
  },
  {
    path: 'admin/members',
    component: AdminAthletesComponent, // will become AdminMembersComponent after rename
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/billing',
    component: AdminBillingComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/billing/:memberId',
    component: AdminBillingComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'wallet',
    component: UserWalletComponent,
    canActivate: [AuthGuard],
    data: { authRequired: true }
  },
  {
    path: 'admin/wallet',
    component: AdminWalletComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  {
    path: 'admin/management',
    component: ManagementComponent,
    canActivate: [AuthGuard],
    data: { authRequired: true, roles: ['ADMIN', 'TRAINER', 'INSTRUCTOR'] }
  }
];
