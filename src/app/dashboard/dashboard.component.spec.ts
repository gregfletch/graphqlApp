import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { GraphQLError } from 'graphql';
import { User } from 'src/app/models/user';

import * as faker from 'faker';
import { UserService } from 'src/app/services/user.service';

import { DashboardComponent, GET_BASIC_USER_INFO } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apolloController: ApolloTestingController;
  let userService: UserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [ApolloTestingModule, HttpClientTestingModule, MatCardModule, MatIconModule],
      providers: [UserService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    apolloController = TestBed.inject(ApolloTestingController);
    userService = TestBed.inject(UserService);

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

    component.ngOnInit();

    component.user$.subscribe((user: User) => {
      expect(user.id).toEqual('user1');
      expect(user.fullName).toEqual(`${firstName} ${lastName}`);
    });

    const request = apolloController.expectOne(GET_BASIC_USER_INFO);

    // Respond with mock data, causing Observable to resolve.
    request.flush({
      data: {
        user: {
          id: 'user1',
          firstName: firstName,
          lastName: lastName,
          fullName: `${firstName} ${lastName}`
        }
      }
    });
  });

  it('stores the fetched user data in the user service', () => {
    const firstName: string = faker.name.firstName();
    const lastName: string = faker.name.lastName();

    component.ngOnInit();

    spyOn(userService, 'user');
    component.user$.subscribe((user: User) => {
      expect(userService.user).toHaveBeenCalledTimes(1);
      expect(userService.user).toHaveBeenCalledWith(user);
    });

    const request = apolloController.expectOne(GET_BASIC_USER_INFO);

    // Respond with mock data, causing Observable to resolve.
    request.flush({
      data: {
        user: {
          id: 'user1',
          firstName: firstName,
          lastName: lastName,
          fullName: `${firstName} ${lastName}`
        }
      }
    });
  });

  it('fails to load user info if an error is returned', () => {
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
    request.graphqlErrors([new GraphQLError('Error making request')]);
  });
});
