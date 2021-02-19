import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ApolloTestingController, ApolloTestingModule, TestOperation } from 'apollo-angular/testing';
import { GraphQLError } from 'graphql';
import { loginActivityFactory } from 'src/app/factories/login_activity';
import { LoginActivity } from 'src/app/models/login-activity';
import { GET_USER_LOGIN_ACTIVITIES_QUERY } from 'src/app/profile/profile.component';

import { ProfileLoginActivityComponent } from './profile-login-activity.component';

describe('ProfileLoginActivityComponent', () => {
  let component: ProfileLoginActivityComponent;
  let fixture: ComponentFixture<ProfileLoginActivityComponent>;
  let apolloController: ApolloTestingController;
  const loginActivity: LoginActivity = loginActivityFactory.build();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileLoginActivityComponent],
      imports: [ApolloTestingModule, HttpClientTestingModule, MatCardModule, MatPaginatorModule, MatSnackBarModule, MatTableModule, NoopAnimationsModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileLoginActivityComponent);
    component = fixture.componentInstance;
    apolloController = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    apolloController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    describe('successfully load user data', () => {
      beforeEach(() => {
        component.ngOnInit();

        const request: TestOperation = apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
        expect(request.operation.variables.first).toEqual(component.pageSize);

        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            loginActivities: loginActivity
          }
        });
      });

      it('loads login activity data', fakeAsync(() => {
        tick();

        expect(component.loginActivity).toEqual(loginActivity);
      }));
    });

    it('does not set user object if request fails', () => {
      component.ngOnInit();

      const request: TestOperation = apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);

      request.graphqlErrors([new GraphQLError('Error making request')]);
      expect(component.loginActivity).toBeNull();
    });
  });

  describe('pageEvent', () => {
    it('fetches login activities when the page size changes', () => {
      component.pageEvent({ pageSize: 5, previousPageIndex: 0, pageIndex: 0, length: 25 });
      apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    it('fetches login activities when next is clicked', () => {
      component.pageEvent({ pageSize: 10, previousPageIndex: 0, pageIndex: 1, length: 25 });
      apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    it('fetches login activities when next is clicked and passes the after cursor', () => {
      jest.spyOn(component, 'loginActivity', 'get').mockReturnValue(loginActivityFactory.build());
      component.pageEvent({ pageSize: 10, previousPageIndex: 0, pageIndex: 1, length: 25 });
      apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    it('fetches login activities when previous is clicked', () => {
      component.pageEvent({ pageSize: 10, previousPageIndex: 1, pageIndex: 0, length: 25 });
      apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    it('fetches login activities when previous is clicked and passes the after cursor', () => {
      jest.spyOn(component, 'loginActivity', 'get').mockReturnValue(loginActivityFactory.build());
      component.pageEvent({ pageSize: 10, previousPageIndex: 1, pageIndex: 0, length: 25 });
      apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    it('does not fetch login activities if the previous page index in the page event is undefined', () => {
      component.pageEvent({ pageSize: 10, previousPageIndex: undefined, pageIndex: 0, length: 25 });
      apolloController.expectNone(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });
  });
});
