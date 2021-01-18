import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccessToken } from 'src/app/models/access-token';
import { AuthToken } from 'src/app/models/auth-token';
import { GrantType, OauthTokenRefreshRequestParams, OauthTokenRequestParams } from 'src/app/models/oauth-token-request-params';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authTokenSubject: BehaviorSubject<AuthToken | null>;
  public authToken: Observable<AuthToken | null>;
  public readonly AUTH_TOKEN_LOCAL_STORAGE_KEY = 'authToken';

  private readonly POST_OAUTH_TOKEN_PATH = environment.idp_base_url + '/oauth/token';

  private static setDefaultHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', Accept: 'application/json' });
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

  login(username: string, password: string): Observable<AuthToken> {
    const params: OauthTokenRequestParams = {
      client_id: environment.idp_client_id,
      email: username,
      grant_type: GrantType.password,
      password: password
    };
    return this.sendTokenRequest(params);
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
    const url: string = this.POST_OAUTH_TOKEN_PATH;
    const headers: HttpHeaders = AuthService.setDefaultHeaders();
    const httpParams: HttpParams = new HttpParams({ fromObject: params });

    return this.httpClient
      .post<AuthToken>(url, httpParams, { headers: headers })
      .pipe(
        map((token: AuthToken) => {
          localStorage.setItem(this.AUTH_TOKEN_LOCAL_STORAGE_KEY, btoa(JSON.stringify(token)));
          this.authTokenSubject.next(token);

          return token;
        })
      );
  }
}
