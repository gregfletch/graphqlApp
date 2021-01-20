import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApolloQueryResult, FetchResult, gql } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GraphqlUpdateUserResponse, GraphqlUsersResponse } from 'src/app/models/graphql-users-response';
import { ProfileForm } from 'src/app/models/profile-form';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

export const GET_USER_INFO = gql`
  query GetUserById($id: ID!) {
    users(id: $id) {
      id
      email
      firstName
      lastName
      confirmed
      currentSignInIp
      currentSignInAt
      lastSignInIp
      lastSignInAt
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUserMutation($id: ID!, $firstName: String, $lastName: String) {
    updateUser(id: $id, firstName: $firstName, lastName: $lastName) {
      user {
        id
        email
        firstName
        lastName
        confirmed
        currentSignInIp
        currentSignInAt
        lastSignInIp
        lastSignInAt
      }
      errors
    }
  }
`;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnDestroy, OnInit {
  user: User | null = null;
  form!: FormGroup;
  loading = false;
  dataChanged = false;
  firstNameTouched = false;
  lastNameTouched = false;
  submitted = false;
  private destroyed$: Subject<void> = new Subject();

  constructor(private apollo: Apollo, private authService: AuthService, private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(128)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(128)]]
    });

    this.apollo
      .watchQuery({
        query: GET_USER_INFO,
        variables: {
          id: this.authService.accessToken?.payload.user.id
        }
      })
      .valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe((result: ApolloQueryResult<unknown>) => {
        const queryResult: GraphqlUsersResponse = result as GraphqlUsersResponse;
        this.user = queryResult.data.users[0];
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
          id: user.id,
          firstName: firstName,
          lastName: lastName
        }
      })
      .subscribe(
        (mutationResult: FetchResult<unknown>) => {
          const result: GraphqlUpdateUserResponse = mutationResult as GraphqlUpdateUserResponse;
          if (result.data.updateUser.user && result.data.updateUser.errors.length === 0) {
            this.user = result.data.updateUser.user;
          }
          this.loading = false;
        },
        (error: HttpErrorResponse) => {
          console.log('there was an error sending the query', error);
          this.loading = false;
        }
      );
  }
}
