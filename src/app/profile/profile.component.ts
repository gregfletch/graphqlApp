import { Component } from '@angular/core';
import { gql } from '@apollo/client/core';

export const GET_USER_INFO = gql`
  query GetUserById {
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
  }
`;

export const GET_USER_LOGIN_ACTIVITIES_QUERY = gql`
  query GetLoginActivitiesByUserId($orderBy: String, $direction: String, $first: Int, $after: String, $last: Int, $before: String) {
    loginActivities(orderBy: $orderBy, direction: $direction, first: $first, after: $after, last: $last, before: $before) {
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
  mutation UpdateUserMutation($firstName: String, $lastName: String) {
    updateUser(firstName: $firstName, lastName: $lastName) {
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
export class ProfileComponent {}
