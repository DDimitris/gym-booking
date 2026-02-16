import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
// Removed mock AuthService usage from UI
import { KeycloakService } from './core/services/keycloak.service';
import { UserService } from './core/services/user.service';
import { environment } from '../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gym-booking-app';

  backendRole: string | null = null;
  currentYear = new Date().getFullYear();
  mobileMenuOpen = false;
  currentLang: 'en' | 'el' = 'en';

  constructor(
    public kc: KeycloakService,
    private users: UserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Best-effort backend role fetch to drive UI visibility after promotions
    if (this.kc.isReady() && this.kc.isAuthenticated()) {
      this.users.getMe().subscribe({
        next: (me) => this.backendRole = (me as any)?.role || null,
        error: () => this.backendRole = null
      });
    }
    // Always use light theme
    this.applyLightTheme();

    // Language preference
    const storedLang = (localStorage.getItem('lang') as 'en' | 'el') || 'en';
    this.currentLang = storedLang;
    this.translate.use(storedLang);
    // Debug: log language events to help diagnose language-switch issues
    this.translate.onLangChange?.subscribe(evt => console.log('Translate:onLangChange', evt));
    this.translate.getTranslation('el').subscribe({
      next: (t) => console.log('Translate:el-loaded, keys:', Object.keys(t || {}).length),
      error: (e) => console.error('Translate:el-load-fail', e)
    });
  }

  async logout() {
    if (this.kc.isReady() && this.kc.isAuthenticated()) {
      await this.kc.logout();
    }
  }

  async kcLogin() {
    await this.kc.login();
  }

  get displayName(): string {
    if (this.kc.isReady() && this.kc.isAuthenticated()) {
      const token: any = this.kc.getParsedToken();
      return token?.preferred_username || token?.email || 'user';
    }
  return 'guest';
  }

  get displayInitial(): string {
    const name = this.displayName;
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  get roleLabel(): string {
    if (this.kc.isReady() && this.kc.isAuthenticated()) {
      const roles = this.kc.getRoles();
      if (roles.includes('ADMIN')) return 'admin';
      if (roles.includes('TRAINER') || roles.includes('INSTRUCTOR')) return 'trainer';
      if (roles.includes('MEMBER') || roles.includes('ATHLETE')) return 'member';
    }
    // Fallback to backend role label
    if (this.backendRole) {
      if (this.backendRole === 'ADMIN') return 'admin';
      if (this.backendRole === 'INSTRUCTOR') return 'trainer';
      if (this.backendRole === 'ATHLETE') return 'member';
    }
    return '';
  }

  get showManagement(): boolean {
    if (!(this.kc.isReady() && this.kc.isAuthenticated())) return false;
    const roles = this.kc.getRoles();
    return roles.includes('ADMIN') || roles.includes('TRAINER') || roles.includes('INSTRUCTOR') || ['ADMIN','TRAINER','INSTRUCTOR'].includes(this.backendRole || '');
  }

  get showHistory(): boolean {
    if (!(this.kc.isReady() && this.kc.isAuthenticated())) return false;
    const roles = this.kc.getRoles();
    // Ensure trainer/instructor roles take precedence and do NOT see history
    if (roles.includes('TRAINER') || roles.includes('INSTRUCTOR')) return false;
    if (this.backendRole === 'TRAINER' || this.backendRole === 'INSTRUCTOR') return false;
    return roles.includes('MEMBER') || roles.includes('ATHLETE') || ['MEMBER','ATHLETE'].includes(this.backendRole || '');
  }

  toggleMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMenu(): void { this.mobileMenuOpen = false; }

  setLang(lang: 'en' | 'el'): void {
    if (this.currentLang === lang) {
      return;
    }
    this.currentLang = lang;
    console.log('Translate:setLang ->', lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  private applyLightTheme(): void {
    // Force light theme globally; no persistence
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('light');
    if (body) {
      body.classList.add('light');
    }
  }

  get showAuthDebug(): boolean {
    return false;
  }
}
