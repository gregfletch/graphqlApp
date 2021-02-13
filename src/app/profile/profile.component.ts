import { animate, state, style, transition, trigger } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ApolloQueryResult, FetchResult, gql } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GraphqlLoginActivitiesResponse } from 'src/app/models/graphql-login-activities-response';
import { GraphqlUpdateUserResponse, GraphqlUserResponse } from 'src/app/models/graphql-users-response';
import { LoginActivity, LoginActivityEdge } from 'src/app/models/login-activity';
import { ProfileForm } from 'src/app/models/profile-form';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

export const GET_USER_INFO = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
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

export const GET_USER_LOGIN_ACTIVITIES_QUERY = gql`
  query GetLoginActivitiesByUserId($userId: ID!, $orderBy: String, $direction: String, $first: Int, $after: String, $last: Int, $before: String) {
    loginActivities(userId: $userId, orderBy: $orderBy, direction: $direction, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
          success
          ip
          createdAt
          identity
          failureReason
          userAgent
          city
          region
          country
        }
      }
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
  styleUrls: ['./profile.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ProfileComponent implements OnDestroy, OnInit {
  private _user: User | null = null;
  form!: FormGroup;
  loading = false;
  dataChanged = false;
  firstNameTouched = false;
  lastNameTouched = false;
  submitted = false;
  private destroyed$: Subject<void> = new Subject();
  displayedColumns: string[] = ['ip', 'success', 'timestamp'];
  private _loginActivity: LoginActivity | null = null;
  expandedElement: LoginActivityEdge | null = null;
  pageSize = 10;

  constructor(private apollo: Apollo, private authService: AuthService, private formBuilder: FormBuilder, private userService: UserService) {}

  ngOnInit(): void {
    this.user = this.userService.user;
    this.form = this.formBuilder.group({
      firstName: [this.user?.firstName, [Validators.required, Validators.minLength(2), Validators.maxLength(128)]],
      lastName: [this.user?.lastName, [Validators.required, Validators.minLength(2), Validators.maxLength(128)]]
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

  profileTabsClicked(event: MatTabChangeEvent): void {
    if (event.index === 2 && !this.loginActivity) {
      this.getLoginActivities();
    }
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

  pageEvent(event: PageEvent): void {
    if (this.pageSize !== event.pageSize) {
      this.pageSize = event.pageSize;
      this.getLoginActivities();
      return;
    }

    let after: string | null = null;
    let before: string | null = null;
    if (event.previousPageIndex !== undefined && event.pageIndex - event.previousPageIndex === 1) {
      // next clicked
      after = this.loginActivity?.pageInfo.endCursor || null;
    } else if (event.previousPageIndex !== undefined && event.pageIndex - event.previousPageIndex === -1) {
      // previous clicked
      before = this.loginActivity?.pageInfo.startCursor || null;
    } else {
      return;
    }

    this.getLoginActivities(after, before);
  }

  private getLoginActivities(after: string | null = null, before: string | null = null): void {
    let first: number | null = null;
    let last: number | null = null;
    if (after === null && before !== null) {
      last = this.pageSize;
    } else {
      first = this.pageSize;
    }

    this.apollo
      .watchQuery({
        query: GET_USER_LOGIN_ACTIVITIES_QUERY,
        variables: {
          userId: this.authService.accessToken?.payload.user.id,
          orderBy: 'created_at',
          direction: 'DESC',
          first: first,
          after: after,
          last: last,
          before: before
        }
      })
      .valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe((result: ApolloQueryResult<unknown>) => {
        const queryResult: GraphqlLoginActivitiesResponse = result as GraphqlLoginActivitiesResponse;
        this.loginActivity = queryResult.data.loginActivities;
      });
  }

  get user(): User | null {
    return this._user;
  }

  set user(user: User | null) {
    this._user = user;
  }

  get loginActivity(): LoginActivity | null {
    return this._loginActivity;
  }

  set loginActivity(value: LoginActivity | null) {
    this._loginActivity = value;
  }
}
