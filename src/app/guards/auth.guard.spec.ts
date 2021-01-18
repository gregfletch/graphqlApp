import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthGuard } from 'src/app/guards/auth.guard';
import { AuthService } from 'src/app/services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    let authService: AuthService;
    let router: Router;

    beforeEach(() => {
      authService = TestBed.inject(AuthService);
      router = TestBed.inject(Router);

      spyOn(router, 'navigate');
    });

    it('returns true if the user is authenticated and their auth token is not expired', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(false);

      expect(guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' })).toBeTruthy();
    });

    it('does not call router#navigate if the route can activate', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(false);

      guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' });

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('returns false if the user is not authenticated and their auth token is not expired', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);
      spyOn(authService, 'isTokenExpired').and.returnValue(false);

      expect(guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' })).toBeFalsy();
    });

    it('returns false if the user is authenticated and their auth token is expired', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(true);

      expect(guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' })).toBeFalsy();
    });

    it('returns false if the user is not authenticated and their auth token is expired', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);
      spyOn(authService, 'isTokenExpired').and.returnValue(true);

      expect(guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' })).toBeFalsy();
    });

    it('calls router#navigate if the route cannot be activated', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);
      spyOn(authService, 'isTokenExpired').and.returnValue(false);

      guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{ url: 'testUrl' });

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
