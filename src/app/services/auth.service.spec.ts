import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authTokenFactory } from 'src/app/factories/auth-token';
import { AuthToken } from 'src/app/models/auth-token';

import * as faker from 'faker';

import { AuthService } from 'src/app/services/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('authTokenValue is null if no existing auth token exists', () => {
    expect(service.authTokenValue).toBeNull();
  });

  it('authTokenValue is not null if an existing auth token exists', () => {
    // We need to reset the test module, to re-instantiate the AuthService with our local storage spy
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    const authToken: AuthToken = authTokenFactory.build();
    spyOn(localStorage, 'getItem').and.returnValue(btoa(JSON.stringify(authToken)));

    const authService: AuthService = TestBed.inject(AuthService);

    expect(authService.authTokenValue).not.toBeNull();
    expect(authService.authTokenValue).toBeTruthy();
  });

  describe('login', () => {
    const authToken: AuthToken = authTokenFactory.build();

    beforeEach(() => {
      httpTestingController = TestBed.inject(HttpTestingController);

      spyOn(localStorage, 'setItem');
    });

    afterEach(() => {
      // After every test, assert that there are no more pending requests.
      httpTestingController.verify();
    });

    it('returns auth token on success', () => {
      service.login(faker.internet.email(), faker.internet.password()).subscribe((response: AuthToken) => {
        // When observable resolves, result should match test data
        expect(response).toEqual(authToken);
      });

      // The following `expectOne()` will match the request's URL.
      // If no requests or multiple requests matched that URL
      // `expectOne()` would throw.
      const req = httpTestingController.expectOne('http://idp.app.lvh.me:3000/oauth/token');

      // Assert that the request is a POST.
      expect(req.request.method).toEqual('POST');

      // Respond with mock data, causing Observable to resolve.
      // Subscribe callback asserts that correct data was returned.
      req.flush(authToken);
    });

    it('stores the auth token in local storage on success', () => {
      service.login(faker.internet.email(), faker.internet.password()).subscribe((_response: AuthToken) => {
        expect(localStorage.setItem).toHaveBeenCalledWith(service.AUTH_TOKEN_LOCAL_STORAGE_KEY, btoa(JSON.stringify(authToken)));
      });

      const req = httpTestingController.expectOne('http://idp.app.lvh.me:3000/oauth/token');
      expect(req.request.method).toEqual('POST');

      req.flush(authToken);
    });

    it('does not write to local storage on error', () => {
      service.login(faker.internet.email(), faker.internet.password()).subscribe(
        (_response: AuthToken) => {
          fail('Unexpected success');
        },
        (error: HttpErrorResponse) => {
          expect(localStorage.setItem).not.toHaveBeenCalled();
          expect(error.status).toEqual(400);
        }
      );

      const req = httpTestingController.expectOne('http://idp.app.lvh.me:3000/oauth/token');
      expect(req.request.method).toEqual('POST');

      req.error(new ErrorEvent('HttpErrorResponse'), { status: 400 });
    });
  });

  describe('isTokenExpired', () => {
    it('returns true if auth token is null', () => {
      spyOnProperty(service, 'authTokenValue', 'get').and.returnValue(null);
      expect(service.isTokenExpired()).toBeTrue();
    });

    it('returns true if auth token is expired', () => {
      const created_at: number = new Date().getTime() / 1000 - (60 * 60 + 1);
      const authToken: AuthToken = authTokenFactory.build({ created_at: created_at });
      spyOnProperty(service, 'authTokenValue', 'get').and.returnValue(authToken);

      expect(service.isTokenExpired()).toBeTrue();
    });

    it('returns false if auth token is not expired', () => {
      const authToken: AuthToken = authTokenFactory.build();
      spyOnProperty(service, 'authTokenValue', 'get').and.returnValue(authToken);

      expect(service.isTokenExpired()).toBeFalse();
    });
  });
});
