import { Component, OnInit } from '@angular/core';
import { ApolloQueryResult, gql } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlUserResponse } from 'src/app/models/graphql-users-response';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

export const GET_BASIC_USER_INFO = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      fullName
      firstName
      lastName
    }
  }
`;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user$: Observable<User> = new Observable<User>();

  constructor(private apollo: Apollo, private authService: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.user$ = this.apollo
      .watchQuery({
        query: GET_BASIC_USER_INFO,
        variables: {
          id: this.authService.accessToken?.payload.user.id
        }
      })
      .valueChanges.pipe(
        map((result: ApolloQueryResult<unknown>) => {
          const queryResult: GraphqlUserResponse = result as GraphqlUserResponse;
          this.userService.user = queryResult.data.user;
          return queryResult.data.user;
        })
      );
  }
}
