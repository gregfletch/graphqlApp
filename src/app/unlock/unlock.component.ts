import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FetchResult, gql } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorSnackbarComponent } from 'src/app/error-snackbar/error-snackbar.component';
import { GraphqlUnlockPasswordResponse } from 'src/app/models/graphql-users-response';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

export const INITIATE_UNLOCK_PASSWORD_MUTATION = gql`
  mutation InitiateUnlockPasswordMutation($email: String!) {
    unlockPassword(email: $email) {
      user {
        id
      }
      errors
    }
  }
`;

export const UNLOCK_PASSWORD_MUTATION = gql`
  mutation UnlockPasswordMutation($unlockToken: String!) {
    unlockPassword(unlockToken: $unlockToken) {
      user {
        id
        sessionId
      }
      errors
    }
  }
`;

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss']
})
export class UnlockComponent implements OnDestroy, OnInit {
  loading = false;
  submitted = false;
  usernameTouched = false;
  form!: FormGroup;
  unlockToken = '';

  private destroyed$: Subject<void> = new Subject();

  constructor(private route: ActivatedRoute, private apollo: Apollo, private formBuilder: FormBuilder, private snackBar: MatSnackBar, private router: Router) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({ username: ['', Validators.required] });

    this.unlockToken = this.route.snapshot.queryParams['unlockToken'] || '';
    if (this.unlockToken) {
      this.unlockAccount();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  initiateUnlockAccount(): void {
    this.submitted = true;

    this.loading = true;
    this.apollo
      .mutate({
        mutation: INITIATE_UNLOCK_PASSWORD_MUTATION,
        variables: {
          email: this.form.controls.username.value
        }
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (mutationResult: FetchResult<unknown>) => {
          const result: GraphqlUnlockPasswordResponse = mutationResult as GraphqlUnlockPasswordResponse;
          if (result.data.unlockPassword.errors.length > 0) {
            this.snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: result.data.unlockPassword.errors[0],
              duration: 3500
            });
          } else {
            this.snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: 'Password unlock instructions sent',
              duration: 3500
            });
          }
          this.loading = false;
        },
        (_error: HttpErrorResponse) => {
          this.loading = false;

          this.snackBar.openFromComponent(ErrorSnackbarComponent, {
            data: 'Error sending request. Please try again.',
            duration: 3500
          });
        }
      );
  }

  unlockAccount(): void {
    this.apollo
      .mutate({
        mutation: UNLOCK_PASSWORD_MUTATION,
        variables: {
          unlockToken: this.unlockToken
        }
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (mutationResult: FetchResult<unknown>) => {
          const result: GraphqlUnlockPasswordResponse = mutationResult as GraphqlUnlockPasswordResponse;
          if (result.data.unlockPassword.errors.length > 0) {
            this.snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: result.data.unlockPassword.errors[0],
              duration: 3500
            });
          } else {
            this.snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: 'Successfully unlocked account',
              duration: 3500
            });
            this.router.navigate(['/']);
          }
        },
        (_error: HttpErrorResponse) => {
          this.snackBar.openFromComponent(ErrorSnackbarComponent, {
            data: 'Error sending request. Please try again.',
            duration: 3500
          });
        }
      );
  }
}
