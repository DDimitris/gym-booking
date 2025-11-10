import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree, CanActivate } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { KeycloakService } from '../services/keycloak.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private kc: KeycloakService, private mockAuth: AuthService, private router: Router, private users: UserService) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const requiredRoles = route.data?.['roles'] as string[] | undefined;
    const authRequired = route.data?.['authRequired'] === true;

    // Enforce authentication if requested
    if (authRequired) {
      if (this.kc.isReady() && this.kc.isAuthenticated()) {
        // Auth OK — also check roles if provided
        if (!requiredRoles || requiredRoles.length === 0) return true;
        const roles = this.kc.getRoles();
        let ok = requiredRoles.some(r => roles.includes(r));
        if (!ok) {
          // Fallback to backend role (User.role) if JWT roles are not yet updated
          try {
            const me = await firstValueFrom(this.users.getMe());
            const backendRole = me?.role as string | undefined;
            if (backendRole) {
              ok = this.matches(requiredRoles, backendRole);
            }
          } catch {
            ok = false;
          }
        }
        if (!ok) this.router.navigate(['/']);
        return ok;
      }
      // Not authenticated — redirect to start page
      this.router.navigate(['/']);
      return false;
    }

    // If auth not required but roles are specified, perform role check when authenticated
    if (requiredRoles && requiredRoles.length > 0) {
      if (this.kc.isReady() && this.kc.isAuthenticated()) {
        const roles = this.kc.getRoles();
        let ok = requiredRoles.some(r => roles.includes(r));
        if (!ok) {
          try {
            const me = await firstValueFrom(this.users.getMe());
            const backendRole = me?.role as string | undefined;
            if (backendRole) ok = this.matches(requiredRoles, backendRole);
          } catch { ok = false; }
        }
        if (!ok) this.router.navigate(['/']);
        return ok;
      }
      // No Keycloak session; deny
      this.router.navigate(['/']);
      return false;
    }

    // No specific requirements
    return true;
  }

  private matches(required: string[], backendRole: string): boolean {
    const r = backendRole.toUpperCase();
    if (r === 'ADMIN') return required.includes('ADMIN');
    if (r === 'TRAINER') return required.includes('TRAINER') || required.includes('INSTRUCTOR');
    if (r === 'INSTRUCTOR') return required.includes('INSTRUCTOR') || required.includes('TRAINER');
    if (r === 'ATHLETE' || r === 'MEMBER') return required.includes('ATHLETE') || required.includes('MEMBER');
    return false;
  }
}