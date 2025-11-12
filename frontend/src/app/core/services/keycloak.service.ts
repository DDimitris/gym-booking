import { Injectable } from '@angular/core';
import Keycloak, { KeycloakInstance, KeycloakInitOptions, KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak?: KeycloakInstance;
  private ready = false;

  async init(): Promise<boolean> {
    try {
      this.keycloak = new (Keycloak as any)({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });

      const options: KeycloakInitOptions = {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        pkceMethod: 'S256'
      } as any;

  const authenticated = await (this.keycloak as any).init(options);
      this.ready = true;
      return authenticated;
    } catch (e) {
      console.warn('Keycloak init failed, falling back to mock auth.', e);
      this.ready = false;
      return false;
    }
  }

  isReady(): boolean { return this.ready; }
  isAuthenticated(): boolean { return !!this.keycloak?.authenticated; }
  getToken(): string | null { return this.keycloak?.token || null; }
  async login(): Promise<void> { await this.keycloak?.login(); }
  async logout(): Promise<void> {
    // Ensure trailing slash so it matches both https://localhost and https://localhost/ patterns
    const origin = window.location.origin.endsWith('/') ? window.location.origin : window.location.origin + '/';
    await this.keycloak?.logout({ redirectUri: origin });
  }
  async updateToken(minValidity = 30): Promise<boolean> { return await this.keycloak?.updateToken(minValidity) || false; }
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
