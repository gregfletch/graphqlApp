import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FetchResult, gql } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { EMPTY, ObservableInput, Subject } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { ErrorSnackbarComponent } from 'src/app/error-snackbar/error-snackbar.component';
import { AuthToken } from 'src/app/models/auth-token';
import { GraphqlResetPasswordResponse } from 'src/app/models/graphql-users-response';
import { AuthService } from 'src/app/services/auth.service';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

export const INITIATE_RESET_PASSWORD_MUTATION = gql`
  mutation InitiateResetPasswordMutation($email: String!) {
    resetPassword(email: $email) {
      user {
        id
      }
      errors
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPasswordMutation($resetToken: String!, $password: String!) {
    resetPassword(resetToken: $resetToken, password: $password) {
      user {
        id
        sessionId
      }
      errors
    }
  }
`;

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnDestroy, OnInit {
  loading = false;
  submitted = false;
  usernameTouched = false;
  passwordTouched = false;
  form!: FormGroup;
  resetToken = '';

  private destroyed$: Subject<void> = new Subject();

  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({ username: ['', Validators.required], password: ['', Validators.required] });

    this.resetToken = this.route.snapshot.queryParams['resetToken'] || '';
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  submitResetForm(): void {
    if (this.resetToken) {
      this.resetPassword();
    } else {
      this.initiateResetPassword();
    }
  }

  initiateResetPassword(): void {
    this.submitted = true;

    this.loading = true;
    this.apollo
      .mutate({
        mutation: INITIATE_RESET_PASSWORD_MUTATION,
        variables: {
          email: this.form.controls.username.value
        }
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (mutationResult: FetchResult<unknown>) => {
          const result: GraphqlResetPasswordResponse = mutationResult as GraphqlResetPasswordResponse;
          if (result.data.resetPassword.errors.length > 0) {
            this.snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: result.data.resetPassword.errors[0],
              duration: 3500
            });
          } else {
            this.snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: 'Password reset instructions sent',
              duration: 3500
            });
          }
          this.loading = false;
        },
        error: (_error: HttpErrorResponse) => {
          this.loading = false;

          this.snackBar.openFromComponent(ErrorSnackbarComponent, {
            data: 'Error sending request. Please try again.',
            duration: 3500
          });
        }
      });
  }

  resetPassword(): void {
    this.submitted = true;

    this.loading = true;
    this.apollo
      .mutate({
        mutation: RESET_PASSWORD_MUTATION,
        variables: {
          password: this.form.controls.password.value,
          resetToken: this.resetToken
        }
      })
      .pipe(
        takeUntil(this.destroyed$),
        mergeMap((mutationResult: FetchResult<unknown>, _index: number): ObservableInput<AuthToken> => {
          const result: GraphqlResetPasswordResponse = mutationResult as GraphqlResetPasswordResponse;
          if (result.data.resetPassword.errors.length > 0) {
            this.snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: result.data.resetPassword.errors[0],
              duration: 3500
            });
          } else {
            this.snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: 'Successfully reset password',
              duration: 3500
            });
          }

          const sessionId = result.data.resetPassword.user?.sessionId || '';
          return sessionId ? this.authService.pkceAuthToken('', sessionId) : EMPTY;
        })
      )
      .subscribe({
        next: (_authTokenResponse: AuthToken) => {
          this.router.navigate(['/']);
          this.loading = false;
        },
        error: (_error: HttpErrorResponse) => {
          this.loading = false;

          this.snackBar.openFromComponent(ErrorSnackbarComponent, {
            data: 'Error sending request. Please try again.',
            duration: 3500
          });
        }
      });
  }
}
