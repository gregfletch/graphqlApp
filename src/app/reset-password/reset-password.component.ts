import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { FetchResult, gql } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorSnackbarComponent } from 'src/app/error-snackbar/error-snackbar.component';
import { GraphqlResetPasswordResponse } from 'src/app/models/graphql-users-response';
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
  form!: FormGroup;
  resetToken: string = '';

  private destroyed$: Subject<void> = new Subject();

  constructor(private route: ActivatedRoute, private apollo: Apollo, private formBuilder: FormBuilder, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({ username: ['', Validators.required] });

    this.resetToken = this.route.snapshot.queryParams['resetToken'] || '';
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  initiateResetPassword(): void {
    console.log('RESET PASSWORD!!');

    this.submitted = true;
    const email: string = this.form.controls.username.value;

    this.loading = true;
    this.apollo
      .mutate({
        mutation: INITIATE_RESET_PASSWORD_MUTATION,
        variables: {
          email: email
        }
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (mutationResult: FetchResult<unknown>) => {
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
        (error: HttpErrorResponse) => {
          console.log('there was an error sending the query', error);
          this.loading = false;

          this.snackBar.openFromComponent(ErrorSnackbarComponent, {
            data: 'Error sending request. Please try again.',
            duration: 3500
          });
        }
      );
  }
}
