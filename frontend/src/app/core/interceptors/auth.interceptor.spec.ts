import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { KeycloakService } from '../services/keycloak.service';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let keycloakService: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', [
      'isReady',
      'isAuthenticated',
      'updateToken',
      'getToken'
    ]);

    keycloakSpy.isReady.and.returnValue(true);
    keycloakSpy.isAuthenticated.and.returnValue(true);
    keycloakSpy.updateToken.and.returnValue(Promise.resolve(true));
    keycloakSpy.getToken.and.returnValue('test-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    keycloakService = TestBed.inject(KeycloakService) as jasmine.SpyObj<KeycloakService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add auth header when token is available', fakeAsync(() => {
    const testToken = 'test-token';
    keycloakService.isReady.and.returnValue(true);
    keycloakService.isAuthenticated.and.returnValue(true);
    keycloakService.getToken.and.returnValue(testToken);

    let ok = false;
    httpClient.get('/api/test').subscribe(() => ok = true);

    tick();

    const httpRequest = httpMock.expectOne('/api/test');
    expect(httpRequest.request.headers.has('Authorization')).toBeTruthy();
    expect(httpRequest.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    httpRequest.flush({});
    expect(ok).toBeTrue();
  }));

  it('should pass through when not authenticated', fakeAsync(() => {
    keycloakService.isReady.and.returnValue(true);
    keycloakService.isAuthenticated.and.returnValue(false);

    let ok = false;
    httpClient.get('/api/test').subscribe(() => ok = true);

    tick();

    const httpRequest = httpMock.expectOne('/api/test');
    expect(httpRequest.request.headers.has('Authorization')).toBeFalse();
    httpRequest.flush({});
    expect(ok).toBeTrue();
  }));
});