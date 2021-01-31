import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, ObservableInput, Subject, throwError } from 'rxjs';
import { catchError, mergeMap, takeUntil } from 'rxjs/operators';
import { AuthResponse } from 'src/app/models/auth-response';
import { AuthToken } from 'src/app/models/auth-token';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy, OnInit {
  loading = false;
  submitted = false;
  usernameTouched = false;
  passwordTouched = false;
  form!: FormGroup;
  returnUrl!: string;

  private destroyed$: Subject<void> = new Subject();

  constructor(private authService: AuthService, private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    if (this.authService.isAuthenticated() && this.authService.isTokenExpired()) {
      this.authService
        .refreshToken()
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          (_tokenResponse: AuthToken) => {
            this.router.navigate([this.returnUrl]);
          },
          (error: HttpErrorResponse) => {
            console.log('ERROR = ', error);
          }
        );
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  login(): void {
    this.submitted = true;

    // Don't bother trying to login if the form is invalid
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.authService
      .login(this.form.controls.username.value, this.form.controls.password.value)
      .pipe(
        catchError(
          (error: HttpErrorResponse, _caught: Observable<AuthResponse>): ObservableInput<AuthResponse> => {
            console.log('ERROR ON LOGIN', error);
            return throwError(error);
          }
        ),
        mergeMap(
          (_response: AuthResponse, _index: number): ObservableInput<AuthToken> => {
            return this.authService.pkceAuthToken(this.form.controls.username.value);
          }
        )
      )
      .subscribe(
        (_authTokenResponse: AuthToken) => {
          this.router.navigate([this.returnUrl]);
        },
        (error: HttpErrorResponse): void => {
          this.loading = false;
          console.log('ERROR ON FETCHING AUTH TOKEN', error);
        }
      );
  }
}
