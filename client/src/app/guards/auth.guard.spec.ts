import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { routes } from '../app.routes';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        AuthGuard,
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
          },
        },
      ],
    });

    authGuard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should allow navigation if user is logged in', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(true);
    expect(authGuard.canActivate()).toBeTrue();
  });

  it('should redirect to login if user is not logged in', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(false);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    expect(authGuard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
