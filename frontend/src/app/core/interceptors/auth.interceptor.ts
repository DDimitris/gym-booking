import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KeycloakService } from '../services/keycloak.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private keycloak: KeycloakService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.keycloak.isReady() || !this.keycloak.isAuthenticated()) {
      return next.handle(request);
    }
    return from(this.keycloak.updateToken(30)).pipe(
      switchMap(() => {
        const token = this.keycloak.getToken();
        if (token) {
          const authReq = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
          return next.handle(authReq);
        }
        return next.handle(request);
      })
    );
  }
}