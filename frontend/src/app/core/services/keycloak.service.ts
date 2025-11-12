import { Injectable } from '@angular/core';
import Keycloak, { KeycloakInstance, KeycloakInitOptions, KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak?: KeycloakInstance;
  private ready = false;

  async init(): Promise<boolean> {
    try {
      if (environment.showAuthDebug) {
        // Minimal sensitive-free debug context
        console.log('[Auth] Initializing Keycloak', {
          url: environment.keycloak.url,
          realm: environment.keycloak.realm,
          clientId: environment.keycloak.clientId
        });
      }
      this.keycloak = new (Keycloak as any)({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });

      const options: KeycloakInitOptions = {
        // Switch to login-required to bypass silent SSO until iframe CSP issue resolved
        onLoad: 'login-required',
        pkceMethod: 'S256'
      } as any;

  const authenticated = await (this.keycloak as any).init(options);
      if (environment.showAuthDebug) {
        const parsed: any = (this.keycloak as any)?.tokenParsed;
        console.log('[Auth] Keycloak init result', {
          authenticated,
          hasToken: !!(this.keycloak as any)?.token,
          subject: parsed?.sub,
          username: parsed?.preferred_username,
          roles: [
            ...(parsed?.realm_access?.roles || []),
            ...((parsed?.roles as string[]) || [])
          ]
        });
      }
      this.ready = true;
      return authenticated;
    } catch (e) {
      console.error('[Auth] Keycloak init failed', e);
      this.ready = false;
      return false;
    }
  }

  isReady(): boolean { return this.ready; }
  isAuthenticated(): boolean { return !!this.keycloak?.authenticated; }
  getToken(): string | null { return this.keycloak?.token || null; }
  async login(): Promise<void> {
    if (environment.showAuthDebug) console.log('[Auth] login() called');
    await this.keycloak?.login();
  }
  async logout(): Promise<void> {
    if (environment.showAuthDebug) console.log('[Auth] logout() called');
    await this.keycloak?.logout({ redirectUri: window.location.origin });
  }
  async updateToken(minValidity = 30): Promise<boolean> {
    try {
      const res = await this.keycloak?.updateToken(minValidity);
      if (environment.showAuthDebug) console.log('[Auth] updateToken()', { res });
      return res || false;
    } catch (e) {
      if (environment.showAuthDebug) console.error('[Auth] updateToken() failed', e);
      return false;
    }
  }
  async getProfile(): Promise<KeycloakProfile | undefined> { return this.keycloak ? await this.keycloak.loadUserProfile() : undefined; }
  getParsedToken(): KeycloakTokenParsed | undefined { return this.keycloak?.tokenParsed; }
  getRoles(): string[] {
    const parsed = this.getParsedToken() as any;
    const realmRoles: string[] = parsed?.realm_access?.roles || [];
    const flatRoles: string[] = parsed?.roles || [];
    const roles = Array.from(new Set([...(realmRoles || []), ...(flatRoles || [])]));
    return roles;
  }
}
