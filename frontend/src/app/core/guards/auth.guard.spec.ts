import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { KeycloakService } from '../services/keycloak.service';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let keycloakService: jasmine.SpyObj<KeycloakService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', [
      'isReady',
      'isAuthenticated',
      'getRoles'
    ]);

    const authSpy = jasmine.createSpyObj('AuthService', [
      'hasRole'
    ]);
    
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: KeycloakService, useValue: keycloakSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    keycloakService = TestBed.inject(KeycloakService) as jasmine.SpyObj<KeycloakService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when authenticated and has required roles', async () => {
    const route = new ActivatedRouteSnapshot();
    route.data = { roles: ['user'] };
    const state = { url: '/dashboard' } as RouterStateSnapshot;

    keycloakService.isReady.and.returnValue(true);
    keycloakService.isAuthenticated.and.returnValue(true);
    keycloakService.getRoles.and.returnValue(['user', 'admin']);

    const result = await guard.canActivate(route, state);
    expect(result).toBeTrue();
  });

  it('should deny access when keycloak not ready', async () => {
    const route = new ActivatedRouteSnapshot();
    route.data = { roles: ['ADMIN'] };
    const state = { url: '/admin' } as RouterStateSnapshot;

    keycloakService.isReady.and.returnValue(false);
    const result = await guard.canActivate(route, state);
    expect(result).toBeFalse();
  });

  it('should navigate home when lacking required roles', async () => {
    const route = new ActivatedRouteSnapshot();
    route.data = { roles: ['admin'] };
    const state = { url: '/admin' } as RouterStateSnapshot;

    keycloakService.isReady.and.returnValue(true);
    keycloakService.isAuthenticated.and.returnValue(true);
    keycloakService.getRoles.and.returnValue(['user']);

    const result = await guard.canActivate(route, state);
    expect(result).toBeFalse();
  });
});