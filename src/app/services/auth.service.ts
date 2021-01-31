import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { AccessToken } from 'src/app/models/access-token';
import { AuthResponse } from 'src/app/models/auth-response';
import { AuthToken } from 'src/app/models/auth-token';
import { LoginParams } from 'src/app/models/login-params';
import { GrantType, OauthTokenRefreshRequestParams, OauthTokenRequestParams } from 'src/app/models/oauth-token-request-params';
import { PkceAuthorizationResponse } from 'src/app/models/pkce-authorization-response';
import { PkceChallenge } from 'src/app/models/pkce-challenge';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authTokenSubject: BehaviorSubject<AuthToken | null>;
  public authToken: Observable<AuthToken | null>;
  public readonly AUTH_TOKEN_LOCAL_STORAGE_KEY = 'authToken';

  private readonly POST_OAUTH_AUTHORIZE_PATH = `${environment.idp_base_url}/oauth/authorize`;
  private readonly POST_OAUTH_TOKEN_PATH = `${environment.idp_base_url}/oauth/token`;
  private readonly POST_USER_LOGIN_PATH = `${environment.idp_base_url}/users/sign_in`;

  private static setDefaultHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', Accept: 'application/json' });
  }

  private static randomString(length: number, mask: string): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += mask.charAt(Math.floor(Math.random() * mask.length));
    }

    return result;
  }

  private static generateVerifier(length: number): string {
    const mask = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';

    return AuthService.randomString(length, mask);
  }

  private static pkceChallenge(length: number): PkceChallenge {
    const verifier = AuthService.generateVerifier(length);

    // Challenge == verifier since we are using plain challenge method for now
    return { challenge: verifier, verifier: verifier };
  }

  constructor(private httpClient: HttpClient) {
    const authToken = localStorage.getItem(this.AUTH_TOKEN_LOCAL_STORAGE_KEY) || null;

    if (authToken !== null) {
      this.authTokenSubject = new BehaviorSubject<AuthToken | null>(JSON.parse(atob(authToken)));
    } else {
      this.authTokenSubject = new BehaviorSubject<AuthToken | null>(null);
    }

    this.authToken = this.authTokenSubject.asObservable();
  }

  public get authTokenValue(): AuthToken | null {
    return this.authTokenSubject.value;
  }

  public get accessToken(): AccessToken | null {
    if (!this.authTokenValue || !this.authTokenValue.access_token) {
      return null;
    }

    const tokenParts: Array<string> = this.authTokenValue.access_token.split('.');
    return {
      header: JSON.parse(atob(tokenParts[0])),
      payload: JSON.parse(atob(tokenParts[1]))
    };
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const params: LoginParams = {
      user: {
        email: email,
        password: password
      }
    };

    return this.httpClient.post<AuthResponse>(this.POST_USER_LOGIN_PATH, params);
  }

  pkceAuthToken(email: string): Observable<AuthToken> {
    const pkceChallenge: PkceChallenge = AuthService.pkceChallenge(128);
    const httpParams: HttpParams = new HttpParams({
      fromObject: {
        client_id: environment.idp_client_id,
        response_type: 'code',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        scope: 'api:graphql',
        code_challenge_method: 'plain',
        code_challenge: pkceChallenge.challenge,
        email: email
      }
    });

    return this.httpClient.post<PkceAuthorizationResponse>(this.POST_OAUTH_AUTHORIZE_PATH, httpParams).pipe(
      mergeMap((response: PkceAuthorizationResponse, _index: number) => {
        const tokenHttpParams: HttpParams = new HttpParams({
          fromObject: {
            grant_type: 'authorization_code',
            client_id: environment.idp_client_id,
            code: response.redirect_uri.code,
            code_verifier: pkceChallenge.verifier,
            redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
          }
        });
        return this.httpClient.post<AuthToken>(this.POST_OAUTH_TOKEN_PATH, tokenHttpParams).pipe(
          map((token: AuthToken) => {
            localStorage.setItem(this.AUTH_TOKEN_LOCAL_STORAGE_KEY, btoa(JSON.stringify(token)));
            this.authTokenSubject.next(token);

            return token;
          })
        );
      })
    );
  }

  refreshToken(): Observable<AuthToken> {
    if (!this.authTokenValue || !this.authTokenValue.refresh_token) {
      return EMPTY;
    }

    const params: OauthTokenRefreshRequestParams = {
      grant_type: GrantType.refresh_token,
      refresh_token: this.authTokenValue.refresh_token,
      client_id: environment.idp_client_id
    };
    return this.sendTokenRequest(params);
  }

  isAuthenticated(): boolean {
    return !!this.authTokenValue;
  }

  isTokenExpired(): boolean {
    const authToken: AuthToken | null = this.authTokenValue;
    if (!authToken) {
      return true;
    }

    const now: number = new Date().getTime() / 1000;
    const expiry: number = authToken.created_at + authToken.expires_in;
    return now > expiry;
  }

  private sendTokenRequest(params: OauthTokenRequestParams | OauthTokenRefreshRequestParams): Observable<AuthToken> {
    const headers: HttpHeaders = AuthService.setDefaultHeaders();
    const httpParams: HttpParams = new HttpParams({ fromObject: params });

    return this.httpClient
      .post<AuthToken>(this.POST_OAUTH_TOKEN_PATH, httpParams, { headers: headers })
      .pipe(
        map((token: AuthToken) => {
          localStorage.setItem(this.AUTH_TOKEN_LOCAL_STORAGE_KEY, btoa(JSON.stringify(token)));
          this.authTokenSubject.next(token);

          return token;
        })
      );
  }
}
