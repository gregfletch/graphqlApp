import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthToken } from 'src/app/models/auth-token';
import { GrantType, OauthTokenRequestParams } from 'src/app/models/oauth-token-request-params';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authTokenSubject: BehaviorSubject<AuthToken | null>;
  public authToken: Observable<AuthToken | null>;
  private readonly AUTH_TOKEN_LOCAL_STORAGE_KEY = 'authToken';

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

  login(username: string, password: string): Observable<AuthToken> {
    const params: OauthTokenRequestParams = {
      client_id: environment.idp_client_id,
      email: username,
      grant_type: GrantType.password,
      password: password
    };
    const url: string = environment.idp_base_url + '/oauth/token';
    const headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'});
    const httpParams: HttpParams = new HttpParams({ fromObject: params });

    return this.httpClient.post<AuthToken>(url, httpParams, { headers: headers }).pipe(map((token: AuthToken) => {
      localStorage.setItem(this.AUTH_TOKEN_LOCAL_STORAGE_KEY, btoa(JSON.stringify(token)));
      this.authTokenSubject.next(token);

      return token;
    }));
  }

  private isTokenExpired(): boolean {
    const authToken: AuthToken | null = this.authTokenValue;
    if (!authToken) {
      return true;
    }

    const now: number = new Date().getTime() / 1000;
    const expiry: number = authToken.created_at + authToken.expires_in;
    return now > expiry;
  }
}
