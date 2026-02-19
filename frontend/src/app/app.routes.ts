import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CalendarComponent } from './features/calendar/calendar.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { KeycloakService } from './core/services/keycloak.service';

// Start (landing) page for unauthenticated users
@Component({
  selector: 'app-start',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="hero container">
      <div class="hero-inner">
        <div class="copy">
          <h1>Book smarter. Train better.</h1>
          <p class="lead">Find classes, manage your wallet, and keep track of your progress — all in one place.</p>
          <div class="actions">
            <button class="btn primary" (click)="login()">{{ 'header.quickLogin' | translate }}</button>
            <button class="btn ghost" (click)="register()">{{ 'header.register' | translate }}</button>
            <a class="btn ghost" href="#features">{{ 'start.learnMore' | translate }}</a>
          </div>
        </div>
        <div class="art" aria-hidden="true">
          <img src="assets/images/logo.png" alt="Gym logo" class="logo-object" />
        </div>
      </div>
    </section>
    <section id="features" class="features container">
      <div class="grid">
        <div class="card pad">
          <h3>{{ 'start.fastBooking' | translate }}</h3>
          <p>{{ 'start.fastBookingDesc' | translate }}</p>
        </div>
        <div class="card pad">
          <h3>{{ 'start.clearHistory' | translate }}</h3>
          <p>{{ 'start.clearHistoryDesc' | translate }}</p>
        </div>
        <div class="card pad">
          <h3>{{ 'start.trainerTools' | translate }}</h3>
          <p>{{ 'start.trainerToolsDesc' | translate }}</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      padding: 72px 0 64px;
      min-height: calc(100vh - 160px);
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .hero-inner {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0,1.3fr) minmax(0,0.9fr);
      gap: 32px;
      align-items: center;
      padding: 32px 32px;
      border-radius: 24px;
      background: rgba(255,255,255,0.9);
      box-shadow: 0 24px 70px rgba(15,23,42,0.40);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(148,163,184,0.35);
    }
    .copy h1 {
      font-size: 44px;
      line-height: 1.05;
      margin: 0 0 12px;
      color: var(--color-text);
    }
    .lead {
      color: var(--color-text-muted);
      margin: 0 0 22px;
      font-size: 18px;
      max-width: 34rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .art {
      text-align: center;
    }
    .logo-object {
      max-width: 360px;
      width: 100%;
      height: auto;
      object-fit: contain;
      border-radius: 0;
      box-shadow: none;
    }
    .features {
      padding: 16px 0 56px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 16px;
    }
    @media (max-width: 900px) {
      .hero {
        padding: 40px 0 32px;
        min-height: auto;
      }
      .hero-inner {
        grid-template-columns: minmax(0,1fr);
        padding: 24px 20px;
        gap: 20px;
      }
      .art {
        margin-top: 8px;
      }
      .grid {
        grid-template-columns: minmax(0,1fr);
      }
    }
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
  register(): void { this.kc.register(); }
}
import { ActivityHistoryComponent } from './features/activity-history/activity-history.component';
import { DocsComponent } from './features/public/docs/docs.component';
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
    path: 'docs',
    component: DocsComponent
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
