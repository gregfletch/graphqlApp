import { HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import * as faker from 'faker';
import { authTokenFactory } from 'src/app/factories/auth-token';

import { AuthInterceptor } from 'src/app/interceptors/auth.interceptor';
import { AuthResponse } from 'src/app/models/auth-response';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

describe('UnauthorizedInterceptor', () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, AuthService]
    });

    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('intercept', () => {
    it('does not set Authorization header if user not authenticated', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);

      authService.login(faker.internet.email(), faker.internet.password()).subscribe();

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/users/sign_in`);
      expect(req.request.headers.has('Authorization')).toBeFalsy();
    });

    it('does not set Authorization header if auth token value is null', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(false);
      jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(null);

      authService.login(faker.internet.email(), faker.internet.password()).subscribe();

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/users/sign_in`);
      expect(req.request.headers.has('Authorization')).toBeFalsy();
    });

    it('sets Authorization header if user is authenticated and access token is not expired', () => {
      jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(authTokenFactory.build());

      authService.login(faker.internet.email(), faker.internet.password()).subscribe();

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/users/sign_in`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    let router: Router;

    beforeEach(() => {
      router = TestBed.inject(Router);
      spyOn(router, 'navigate');
    });

    it('navigates to login if a 401 response is returned', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);

      const sub = authService.login(faker.internet.email(), faker.internet.password()).subscribe(
        (_response: AuthResponse) => {
          fail('Unexpected success');
        },
        (error: HttpErrorResponse) => {
          expect(error.status).toEqual(401);
        }
      );

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/users/sign_in`);
      req.error(new ErrorEvent('HttpErrorResponse'), { status: 401 });

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      sub.unsubscribe();
    });

    it('does not navigate if error response is other than 401', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);

      [400, 403, 409, 422, 500, 501, 503].forEach((status: number) => {
        const sub = authService.login(faker.internet.email(), faker.internet.password()).subscribe(
          (_response: AuthResponse) => {
            fail('Unexpected success');
          },
          (error: HttpErrorResponse) => {
            expect(error.status).toEqual(status);
          }
        );
        const req = httpTestingController.expectOne(`${environment.idp_base_url}/users/sign_in`);
        req.error(new ErrorEvent('HttpErrorResponse'), { status: status });

        expect(router.navigate).not.toHaveBeenCalled();
        sub.unsubscribe();
      });
    });
  });
});
