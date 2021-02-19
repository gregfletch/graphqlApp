import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApolloQueryResult, FetchResult } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GraphqlUpdateUserResponse, GraphqlUserResponse } from 'src/app/models/graphql-users-response';
import { ProfileForm } from 'src/app/models/profile-form';
import { User } from 'src/app/models/user';
import { GET_USER_INFO, UPDATE_USER_MUTATION } from 'src/app/profile/profile.component';
import { UserService } from 'src/app/services/user.service';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

@Component({
  selector: 'app-profile-user-info',
  templateUrl: './profile-user-info.component.html',
  styleUrls: ['./profile-user-info.component.scss']
})
export class ProfileUserInfoComponent implements OnDestroy, OnInit {
  private _user: User | null = this.userService.user;
  form!: FormGroup;
  loading = false;
  dataChanged = false;
  firstNameTouched = false;
  lastNameTouched = false;
  submitted = false;
  private destroyed$: Subject<void> = new Subject();

  constructor(private apollo: Apollo, private formBuilder: FormBuilder, private snackBar: MatSnackBar, private userService: UserService) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      firstName: [this.user?.firstName, [Validators.required, Validators.minLength(2), Validators.maxLength(128)]],
      lastName: [this.user?.lastName, [Validators.required, Validators.minLength(2), Validators.maxLength(128)]]
    });

    this.apollo
      .watchQuery({
        query: GET_USER_INFO
      })
      .valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe((result: ApolloQueryResult<unknown>) => {
        const queryResult: GraphqlUserResponse = result as GraphqlUserResponse;
        this.user = queryResult.data.user;
        this.userService.user = this.user;
        this.form.setValue({ firstName: this.user.firstName, lastName: this.user.lastName });
      });

    this.form.valueChanges.subscribe((newFormValues: ProfileForm) => {
      this.dataChanged = newFormValues.firstName !== this.user?.firstName || newFormValues.lastName !== this.user.lastName;
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  updateUser(user: User): void {
    this.submitted = true;
    const firstName: string = this.form.controls.firstName.value;
    const lastName: string = this.form.controls.lastName.value;
    const dataChanged: boolean = firstName !== user.firstName || lastName !== user.lastName;

    if (!dataChanged) {
      return;
    }

    this.loading = true;
    this.apollo
      .mutate({
        mutation: UPDATE_USER_MUTATION,
        variables: {
          firstName: firstName,
          lastName: lastName
        }
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (mutationResult: FetchResult<unknown>) => {
          const result: GraphqlUpdateUserResponse = mutationResult as GraphqlUpdateUserResponse;
          if (result.data.updateUser.user && result.data.updateUser.errors.length === 0) {
            this.user = result.data.updateUser.user;

            this.snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: 'User information updated successfully',
              duration: 3500
            });
          }
          this.loading = false;
        },
        (error: HttpErrorResponse) => {
          console.log('there was an error sending the query', error);
          this.loading = false;

          // this.snackBar.openFromComponent(SuccessSnackbarComponent, {
          //   data: 'Error sending request. Please try again.',
          //   duration: 3500
          // });
        }
      );
  }

  get user(): User | null {
    return this._user;
  }

  set user(user: User | null) {
    this._user = user;
  }
}
