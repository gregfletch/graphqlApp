import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchResult, gql } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorSnackbarComponent } from 'src/app/error-snackbar/error-snackbar.component';
import { GraphqlChangePasswordResponse } from 'src/app/models/graphql-users-response';
import { ProfileSecurityForm } from 'src/app/models/profile-security-form';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePasswordMutation($currentPassword: String!, $password: String!) {
    changePassword(currentPassword: $currentPassword, password: $password) {
      user {
        id
      }
      errors
    }
  }
`;

@Component({
  selector: 'app-profile-security',
  templateUrl: './profile-security.component.html',
  styleUrls: ['./profile-security.component.scss']
})
export class ProfileSecurityComponent implements OnDestroy, OnInit {
  form!: FormGroup;
  loading = false;
  newPasswordTouched = false;
  currentPasswordTouched = false;
  submitted = false;
  private destroyed$: Subject<void> = new Subject();

  constructor(private apollo: Apollo, private formBuilder: FormBuilder, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(128)]],
      currentPassword: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(128)]]
    });

    this.form.valueChanges.subscribe((newFormValues: ProfileSecurityForm) => {
      if (newFormValues.currentPassword === newFormValues.newPassword) {
        this.form.controls.newPassword.setErrors({ uniqueness: true });
      } else {
        if (this.form.controls.newPassword.errors) {
          delete this.form.controls.newPassword.errors.uniqueness;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  changePassword(): void {
    this.submitted = true;
    const currentPassword: string = this.form.controls.currentPassword.value;
    const newPassword: string = this.form.controls.newPassword.value;

    this.loading = true;
    this.apollo
      .mutate({
        mutation: CHANGE_PASSWORD_MUTATION,
        variables: {
          currentPassword: currentPassword,
          password: newPassword
        }
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (mutationResult: FetchResult<unknown>) => {
          const result: GraphqlChangePasswordResponse = mutationResult as GraphqlChangePasswordResponse;
          if (result.data.changePassword.errors.length > 0) {
            this.snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: result.data.changePassword.errors[0],
              duration: 3500
            });
          } else {
            this.snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: 'Password updated successfully',
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
}
