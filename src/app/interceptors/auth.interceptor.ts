import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.authService.isAuthenticated() && !this.authService.isTokenExpired()) {
      request = this.addAuthorizationHeader(request);
    }

    return next.handle(request).pipe(
      catchError((response: HttpErrorResponse) => {
          if (response.status === 401) {
            this.router.navigate(['/login']);
          }
          return throwError(response);
        }
      )
    );
  }

  private addAuthorizationHeader(request: HttpRequest<unknown>): HttpRequest<unknown> {
    if (this.authService.authTokenValue?.access_token) {
      return request.clone({
        setHeaders: {
          'Authorization': `Bearer ${this.authService.authTokenValue.access_token}`
        }
      });
    }

    return request;
  }
}
