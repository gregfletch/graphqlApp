import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { GraphQLError } from 'graphql';
import { authTokenFactory } from 'src/app/factories/auth-token';
import { AuthToken } from 'src/app/models/auth-token';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

import * as faker from 'faker';

import { DashboardComponent, GET_BASIC_USER_INFO } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apolloController: ApolloTestingController;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [ApolloTestingModule, HttpClientTestingModule],
      providers: [AuthService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    apolloController = TestBed.inject(ApolloTestingController);
    authService = TestBed.inject(AuthService);

    component = fixture.componentInstance;
  });

  afterEach(() => {
    apolloController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads basic user info', () => {
    const firstName: string = faker.name.firstName();
    const lastName: string = faker.name.lastName();
    const authToken: AuthToken = authTokenFactory.build();
    jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(authToken);

    component.ngOnInit();

    component.user$.subscribe((user: User) => {
      expect(user.id).toEqual('user1');
      expect(user.fullName).toEqual(`${firstName} ${lastName}`);
    });

    const request = apolloController.expectOne(GET_BASIC_USER_INFO);
    expect(request.operation.variables.id).toEqual('user1');

    // Respond with mock data, causing Observable to resolve.
    request.flush({
      data: {
        users: [
          {
            id: 'user1',
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`
          }
        ]
      }
    });
  });

  it('fails to load user info if access token does not contain user ID', () => {
    jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(null);

    component.ngOnInit();

    component.user$.subscribe(
      (_user: User) => {
        fail('Unexpected success!');
      },
      (error: HttpErrorResponse) => {
        expect(error.status).toEqual(400);
      }
    );

    const request = apolloController.expectOne(GET_BASIC_USER_INFO);
    expect(request.operation.variables.id).toEqual(undefined);

    request.graphqlErrors([new GraphQLError('Error making request')]);
  });
});
