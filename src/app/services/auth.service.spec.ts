import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { authResponseFactory } from 'src/app/factories/auth-response';
import { authTokenFactory } from 'src/app/factories/auth-token';
import { pkceAuthorizationResponse } from 'src/app/factories/pkce-authorization-response';
import { AccessTokenHeader, AccessTokenPayload } from 'src/app/models/access-token';
import { AuthResponse } from 'src/app/models/auth-response';
import { AuthToken } from 'src/app/models/auth-token';

import * as faker from 'faker';
import { PkceAuthorizationResponse } from 'src/app/models/pkce-authorization-response';

import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import SpyInstance = jest.SpyInstance;

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
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(btoa(JSON.stringify(authToken)));

    const authService: AuthService = TestBed.inject(AuthService);

    expect(authService.authTokenValue).not.toBeNull();
    expect(authService.authTokenValue).toBeTruthy();
  });

  describe('login', () => {
    const email: string = faker.internet.email();
    const password: string = faker.internet.password(8);
    const authResponse: AuthResponse = authResponseFactory.build();

    beforeEach(() => {
      httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      // After every test, assert that there are no more pending requests.
      httpTestingController.verify();
    });

    it('return auth response on success', () => {
      service.login(email, password).subscribe((response: AuthResponse) => {
        expect(response).toEqual(authResponse);
      });

      // The following `expectOne()` will match the request's URL.
      // If no requests or multiple requests matched that URL
      // `expectOne()` would throw.
      const req = httpTestingController.expectOne(`${environment.idp_base_url}/users/sign_in`);

      // Assert that the request is a POST.
      expect(req.request.method).toEqual('POST');

      // Respond with mock data, causing Observable to resolve.
      // Subscribe callback asserts that correct data was returned.
      req.flush(authResponse);
    });

    it('forwards error response onto calling component on error', () => {
      service.login(faker.internet.email(), faker.internet.password()).subscribe(
        (_response: AuthResponse) => {
          fail('Unexpected success');
        },
        (error: HttpErrorResponse) => {
          expect(error.status).toEqual(400);
        }
      );

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/users/sign_in`);
      expect(req.request.method).toEqual('POST');

      req.error(new ErrorEvent('HttpErrorResponse'), { status: 400 });
    });
  });

  describe('pkceAuthToken', () => {
    const authorizationResponse: PkceAuthorizationResponse = pkceAuthorizationResponse.build();

    beforeEach(() => {
      httpTestingController = TestBed.inject(HttpTestingController);

      spyOn(localStorage, 'setItem');
    });

    afterEach(() => {
      // After every test, assert that there are no more pending requests.
      httpTestingController.verify();
    });

    it('calls /oauth/token if call to oauth/authorize is successful', () => {
      service.pkceAuthToken(faker.internet.email()).subscribe();

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/authorize`);
      expect(req.request.method).toEqual('POST');
      req.flush(authorizationResponse);

      httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);
    });

    it('does not call /oauth/token if authorization call fails', () => {
      service.pkceAuthToken(faker.internet.email()).subscribe(
        (_response: AuthToken) => {
          fail('Unexpected success');
        },
        (error: HttpErrorResponse) => {
          expect(error.status).toEqual(400);
        }
      );

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/authorize`);
      expect(req.request.method).toEqual('POST');
      req.error(new ErrorEvent('HttpErrorResponse'), { status: 400 });

      httpTestingController.expectNone(`${environment.idp_base_url}/oauth/token`);
    });

    it('returns auth token if the PKCE grant flow is successful', () => {
      const authToken: AuthToken = authTokenFactory.build();
      service.pkceAuthToken(faker.internet.email()).subscribe((response: AuthToken) => {
        // When observable resolves, result should match test data
        expect(response).toEqual(authToken);
      });

      let req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/authorize`);
      expect(req.request.method).toEqual('POST');
      req.flush(authorizationResponse);

      req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);
      expect(req.request.method).toEqual('POST');
      req.flush(authToken);
    });

    it('stores the auth token in local storage on success', () => {
      const authToken: AuthToken = authTokenFactory.build();
      service.pkceAuthToken(faker.internet.email()).subscribe((_response: AuthToken) => {
        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
        expect(localStorage.setItem).toHaveBeenCalledWith(service.AUTH_TOKEN_LOCAL_STORAGE_KEY, btoa(JSON.stringify(authToken)));
      });

      let req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/authorize`);
      expect(req.request.method).toEqual('POST');
      req.flush(authorizationResponse);

      req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);
      expect(req.request.method).toEqual('POST');
      req.flush(authToken);
    });

    it('forwards error response if call to /oauth/token is not successful', () => {
      service.pkceAuthToken(faker.internet.email()).subscribe(
        (_response: AuthToken) => {
          fail('Unexpected success');
        },
        (error: HttpErrorResponse) => {
          expect(error.status).toEqual(400);
        }
      );

      let req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/authorize`);
      expect(req.request.method).toEqual('POST');
      req.flush(authorizationResponse);

      req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);
      expect(req.request.method).toEqual('POST');
      req.error(new ErrorEvent('HttpErrorResponse'), { status: 400 });
    });

    it('does not write to localStorage if call to /oauth/token is not successful', () => {
      service.pkceAuthToken(faker.internet.email()).subscribe(
        (_response: AuthToken) => {
          fail('Unexpected success');
        },
        (_error: HttpErrorResponse) => {
          expect(localStorage.setItem).not.toHaveBeenCalled();
        }
      );

      let req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/authorize`);
      expect(req.request.method).toEqual('POST');
      req.flush(authorizationResponse);

      req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);
      expect(req.request.method).toEqual('POST');
      req.error(new ErrorEvent('HttpErrorResponse'), { status: 400 });
    });
  });

  describe('refreshToken', () => {
    const authToken: AuthToken = authTokenFactory.build();
    let authTokenValueSpy: jest.SpyInstance<AuthToken | null>;

    beforeEach(() => {
      httpTestingController = TestBed.inject(HttpTestingController);

      spyOn(localStorage, 'setItem');
      authTokenValueSpy = jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(authTokenFactory.build());
    });

    afterEach(() => {
      // After every test, assert that there are no more pending requests.
      httpTestingController.verify();
    });

    it('returns auth token on success', () => {
      service.refreshToken().subscribe((response: AuthToken) => {
        // When observable resolves, result should match test data
        expect(response).toEqual(authToken);
      });

      // The following `expectOne()` will match the request's URL.
      // If no requests or multiple requests matched that URL
      // `expectOne()` would throw.
      const req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);

      // Assert that the request is a POST.
      expect(req.request.method).toEqual('POST');

      // Respond with mock data, causing Observable to resolve.
      // Subscribe callback asserts that correct data was returned.
      req.flush(authToken);
    });

    it('stores the auth token in local storage on success', () => {
      service.refreshToken().subscribe((_response: AuthToken) => {
        expect(localStorage.setItem).toHaveBeenCalledWith(service.AUTH_TOKEN_LOCAL_STORAGE_KEY, btoa(JSON.stringify(authToken)));
      });

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);
      expect(req.request.method).toEqual('POST');

      req.flush(authToken);
    });

    it('does not write to local storage on error', () => {
      service.refreshToken().subscribe(
        (_response: AuthToken) => {
          fail('Unexpected success');
        },
        (error: HttpErrorResponse) => {
          expect(localStorage.setItem).not.toHaveBeenCalled();
          expect(error.status).toEqual(400);
        }
      );

      const req = httpTestingController.expectOne(`${environment.idp_base_url}/oauth/token`);
      expect(req.request.method).toEqual('POST');

      req.error(new ErrorEvent('HttpErrorResponse'), { status: 400 });
    });

    it('returns EMPTY observable if no auth token present', () => {
      authTokenValueSpy.mockReturnValue(null);

      expect(service.refreshToken()).toEqual(EMPTY);
    });

    it('returns EMPTY observable if auth token does not contain a refresh token', () => {
      authTokenValueSpy.mockReturnValue(
        authTokenFactory.build({
          refresh_token: ''
        })
      );

      expect(service.refreshToken()).toEqual(EMPTY);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true if auth token value is not null', () => {
      const authToken: AuthToken = authTokenFactory.build();
      jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(authToken);

      expect(service.isAuthenticated()).toBeTruthy();
    });

    it('returns false if auth token value is not present', () => {
      const authTokenValueSpy: SpyInstance = jest.spyOn(service, 'authTokenValue', 'get');

      [null, undefined].forEach((value: null | undefined) => {
        authTokenValueSpy.mockReturnValue(value);

        expect(service.isAuthenticated()).toBeFalsy();
      });
    });
  });

  describe('isTokenExpired', () => {
    it('returns true if auth token is null', () => {
      jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(null);
      expect(service.isTokenExpired()).toBeTruthy();
    });

    it('returns true if auth token is expired', () => {
      const created_at: number = new Date().getTime() / 1000 - (60 * 60 + 1);
      const authToken: AuthToken = authTokenFactory.build({ created_at: created_at });
      jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(authToken);

      expect(service.isTokenExpired()).toBeTruthy();
    });

    it('returns false if auth token is not expired', () => {
      const authToken: AuthToken = authTokenFactory.build();
      jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(authToken);

      expect(service.isTokenExpired()).toBeFalsy();
    });
  });

  describe('accessToken', () => {
    it('returns null if auth token value is null', () => {
      jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(null);
      expect(service.accessToken).toBeNull();
    });

    it('returns null if auth token access_token is not set', () => {
      jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(authTokenFactory.build({ access_token: '' }));
      expect(service.accessToken).toBeNull();
    });

    it('returns the decoded access token if access_token is present in auth token', () => {
      const accessTokenHeader: AccessTokenHeader = { alg: 'HS256', kid: 'kid1', typ: 'JWT' };
      const accessTokenPayload: AccessTokenPayload = {
        aud: 'http://audience.com',
        exp: 1610868061,
        iat: 1610853661,
        iss: 'http://issuer.com',
        jti: 'id1',
        scopes: 'api:graphql',
        sub: 'http://subscriber.com',
        user: {
          id: 'user1'
        }
      };
      const accessToken = `${btoa(JSON.stringify(accessTokenHeader))}.${btoa(JSON.stringify(accessTokenPayload))}`;
      jest.spyOn(service, 'authTokenValue', 'get').mockReturnValue(authTokenFactory.build({ access_token: accessToken }));

      expect(service.accessToken).toEqual({ header: accessTokenHeader, payload: accessTokenPayload });
    });
  });
});
