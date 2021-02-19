import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ApolloQueryResult } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GraphqlLoginActivitiesResponse } from 'src/app/models/graphql-login-activities-response';
import { LoginActivity, LoginActivityEdge } from 'src/app/models/login-activity';
import { GET_USER_LOGIN_ACTIVITIES_QUERY } from 'src/app/profile/profile.component';

@Component({
  selector: 'app-profile-login-activity',
  templateUrl: './profile-login-activity.component.html',
  styleUrls: ['./profile-login-activity.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ProfileLoginActivityComponent implements OnDestroy, OnInit {
  private destroyed$: Subject<void> = new Subject();
  displayedColumns: string[] = ['ip', 'success', 'timestamp'];
  private _loginActivity: LoginActivity | null = null;
  expandedElement: LoginActivityEdge | null = null;
  pageSize = 10;

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.getLoginActivities();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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

  get loginActivity(): LoginActivity | null {
    return this._loginActivity;
  }

  set loginActivity(value: LoginActivity | null) {
    this._loginActivity = value;
  }
}
