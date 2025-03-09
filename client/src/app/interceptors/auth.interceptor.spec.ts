import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';



describe('AuthInterceptor', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptorsFromDi()
        ),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => 'fake-token' } },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ],
    });

    authService = TestBed.inject(AuthService);
  });

  it('should add an Authorization header', () => {
    const httpClient = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeTruthy();
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    httpMock.verify();
  });
});
