import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ViewContainerRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingController, ApolloTestingModule, TestOperation } from 'apollo-angular/testing';
import faker from 'faker';
import { GraphQLError } from 'graphql';
import { authTokenFactory } from 'src/app/factories/auth-token';
import { loginActivityFactory } from 'src/app/factories/login_activity';
import { userFactory } from 'src/app/factories/user';
import { AuthToken } from 'src/app/models/auth-token';
import { LoginActivity } from 'src/app/models/login-activity';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

import { GET_USER_INFO, GET_USER_LOGIN_ACTIVITIES_QUERY, ProfileComponent, UPDATE_USER_MUTATION } from './profile.component';
import Mock = jest.Mock;

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: AuthService;
  let apolloController: ApolloTestingController;
  const user: User = userFactory.build();
  const authToken: AuthToken = authTokenFactory.build();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createSpyObj = (_baseName: string, methodNames: Array<string>): { [key: string]: Mock<any> } => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = {};

    for (let i = 0; i < methodNames.length; i++) {
      obj[methodNames[i]] = jest.fn();
    }

    return obj;
  };
  const viewContainerRefSpy = createSpyObj('ViewContainerRef', ['insert']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      imports: [
        ApolloTestingModule,
        HttpClientTestingModule,
        MatCardModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatTabsModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [AuthService, { provide: ViewContainerRef, useValue: viewContainerRefSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    apolloController = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    apolloController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apolloController.expectOne(GET_USER_INFO);
    });

    it('is invalid by default', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('is valid on load if user is set and has first and last name populated', () => {
      jest.spyOn(component, 'user', 'get').mockReturnValue(userFactory.build());
      component.ngOnInit();

      expect(component.form.valid).toBeTruthy();
    });

    it('is valid if all required fields are filled', () => {
      component.form.setValue({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      });
      expect(component.form.valid).toBeTruthy();
    });

    describe('first name', () => {
      it('sets required error if firstName field is blank', () => {
        expect(component.form.controls.firstName.errors).not.toBeNull();

        if (component.form.controls.firstName.errors) {
          expect(component.form.controls.firstName.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if firstName field is too short', () => {
        component.form.setValue({ firstName: 'a', lastName: '' });
        expect(component.form.controls.firstName.errors).not.toBeNull();

        if (component.form.controls.firstName.errors) {
          expect(component.form.controls.firstName.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if firstName field is too long', () => {
        component.form.setValue({ firstName: 'a'.repeat(129), lastName: '' });
        expect(component.form.controls.firstName.errors).not.toBeNull();

        if (component.form.controls.firstName.errors) {
          expect(component.form.controls.firstName.errors['maxlength']).toBeTruthy();
        }
      });
    });

    describe('last name', () => {
      it('sets required error if lastName field is blank', () => {
        expect(component.form.controls.lastName.errors).not.toBeNull();

        if (component.form.controls.lastName.errors) {
          expect(component.form.controls.lastName.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if lastName field is too short', () => {
        component.form.setValue({ firstName: '', lastName: 'a' });
        expect(component.form.controls.lastName.errors).not.toBeNull();

        if (component.form.controls.lastName.errors) {
          expect(component.form.controls.lastName.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if lastName field is too long', () => {
        component.form.setValue({ firstName: '', lastName: 'a'.repeat(129) });
        expect(component.form.controls.lastName.errors).not.toBeNull();

        if (component.form.controls.lastName.errors) {
          expect(component.form.controls.lastName.errors['maxlength']).toBeTruthy();
        }
      });
    });
  });

  describe('ngOnInit', () => {
    describe('successfully load user data', () => {
      beforeEach(() => {
        jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(authToken);

        component.ngOnInit();

        const request: TestOperation = apolloController.expectOne(GET_USER_INFO);
        expect(request.operation.variables.id).toEqual('user1');

        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            user: {
              id: user.id,
              confirmed: user.confirmed,
              currentSignInAt: user.currentSignInAt,
              currentSignInIp: user.currentSignInIp,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              lastSignInAt: user.lastSignInAt,
              lastSignInIp: user.lastSignInIp
            }
          }
        });
      });

      it('loads full user info', fakeAsync(() => {
        tick();

        expect(component.user).toEqual(user);
      }));

      it('sets first name and last name fields to fetched user attributes', fakeAsync(() => {
        tick();

        expect(component.form.controls.firstName.value).toEqual(user.firstName);
        expect(component.form.controls.lastName.value).toEqual(user.lastName);
      }));

      it('dataChanged is false on load', fakeAsync(() => {
        tick();

        expect(component.dataChanged).toBeFalsy();
      }));

      it('dataChanged is true when first name has been updated', fakeAsync(() => {
        tick();

        component.form.controls.firstName.setValue('Updated');

        expect(component.dataChanged).toBeTruthy();
      }));

      it('dataChanged is true when last name has been updated', fakeAsync(() => {
        tick();

        component.form.controls.lastName.setValue('Modified');

        expect(component.dataChanged).toBeTruthy();
      }));

      it('dataChanged is true when first name and last name have been updated', fakeAsync(() => {
        tick();

        component.form.controls.firstName.setValue('Updated');
        component.form.controls.lastName.setValue('Modified');

        expect(component.dataChanged).toBeTruthy();
      }));
    });

    it('does not set user object if request fails', () => {
      jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(null);

      component.ngOnInit();

      const request: TestOperation = apolloController.expectOne(GET_USER_INFO);
      expect(request.operation.variables.id).toEqual(undefined);

      request.graphqlErrors([new GraphQLError('Error making request')]);

      expect(component.user).toBeNull();
    });
  });

  describe('updateUser', () => {
    beforeEach(fakeAsync(() => {
      jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(authToken);

      component.ngOnInit();

      const request: TestOperation = apolloController.expectOne(GET_USER_INFO);
      expect(request.operation.variables.id).toEqual('user1');

      // Respond with mock data, causing Observable to resolve.
      request.flush({
        data: {
          user: {
            id: user.id,
            confirmed: user.confirmed,
            currentSignInAt: user.currentSignInAt,
            currentSignInIp: user.currentSignInIp,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            lastSignInAt: user.lastSignInAt,
            lastSignInIp: user.lastSignInIp
          }
        }
      });

      tick();

      expect(component.user).toEqual(user);
    }));

    it('does not send update user mutation request if data has not changed', () => {
      component.updateUser(user);
      apolloController.expectNone(UPDATE_USER_MUTATION);
    });

    describe('sends update user mutation', () => {
      let request: TestOperation;

      beforeEach(() => {
        component.form.controls.firstName.setValue('Updated');
        component.form.controls.lastName.setValue('Modified');

        component.updateUser(user);

        request = apolloController.expectOne(UPDATE_USER_MUTATION);
        expect(request.operation.variables.id).toEqual(user.id);
        expect(request.operation.variables.firstName).toEqual('Updated');
        expect(request.operation.variables.lastName).toEqual('Modified');
        expect(component.loading).toBeTruthy();
      });

      describe('successfully sends update user mutation request', () => {
        beforeEach(() => {
          // Respond with mock data, causing Observable to resolve.
          request.flush({
            data: {
              updateUser: {
                user: {
                  id: user.id,
                  confirmed: user.confirmed,
                  currentSignInAt: user.currentSignInAt,
                  currentSignInIp: user.currentSignInIp,
                  email: user.email,
                  firstName: 'Updated',
                  lastName: 'Modified',
                  lastSignInAt: user.lastSignInAt,
                  lastSignInIp: user.lastSignInIp
                },
                errors: []
              }
            }
          });
        });

        it('sets loading flag prior to sending request and disables after response returned', () => {
          expect(component.loading).toBeFalsy();
        });

        it('sets user object with updated value if no errors returned', () => {
          const newUser = { ...user };
          newUser.firstName = 'Updated';
          newUser.lastName = 'Modified';
          expect(component.user).toEqual(newUser);
        });
      });

      it('does not update user object if response contains errors', () => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            updateUser: {
              user: {
                id: user.id,
                confirmed: user.confirmed,
                currentSignInAt: user.currentSignInAt,
                currentSignInIp: user.currentSignInIp,
                email: user.email,
                firstName: 'Updated',
                lastName: 'Modified',
                lastSignInAt: user.lastSignInAt,
                lastSignInIp: user.lastSignInIp
              },
              errors: ['First name is invalid.']
            }
          }
        });

        expect(component.user).toEqual(user);
      });

      describe('network error on update user mutation', () => {
        beforeEach(() => {
          request.networkError(new Error());
        });

        it('does not update user object if an error response is returned', () => {
          expect(component.user).toEqual(user);
        });

        it('disabled loading flag if an error response is returned', () => {
          expect(component.loading).toBeFalsy();
        });
      });
    });
  });

  describe('profileTabsClicked', () => {
    it("makes call to get user's login activities if not already loaded and the history tab is clicked", () => {
      component.profileTabsClicked({ index: 2, tab: new MatTab(TestBed.inject(ViewContainerRef), null) });
      apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    it("does not fetch user's login activities if already loaded and the history tab is clicked", () => {
      spyOn(component, 'loginActivity').and.returnValue(loginActivityFactory.build());
      component.profileTabsClicked({ index: 2, tab: new MatTab(TestBed.inject(ViewContainerRef), null) });
      apolloController.expectNone(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    it("does not fetch user's login activities if tab other than history tab is clicked", () => {
      component.profileTabsClicked({ index: 0, tab: new MatTab(TestBed.inject(ViewContainerRef), null) });
      apolloController.expectNone(GET_USER_LOGIN_ACTIVITIES_QUERY);
    });

    describe('calls graphQL endpoint', () => {
      let request: TestOperation;

      beforeEach(() => {
        jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(authToken);

        component.profileTabsClicked({ index: 2, tab: new MatTab(TestBed.inject(ViewContainerRef), null) });
        request = apolloController.expectOne(GET_USER_LOGIN_ACTIVITIES_QUERY);
        expect(request.operation.variables.userId).toEqual('user1');
        expect(request.operation.variables.first).toEqual(component.pageSize);
      });

      it("sets loginActivities to the user's login activities", fakeAsync(() => {
        const loginActivity: LoginActivity = loginActivityFactory.build();

        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            loginActivities: loginActivity
          }
        });

        tick();

        expect(component.loginActivity).toEqual(loginActivity);
      }));

      it("does not set login activities to the user's login activities if error returned", () => {
        // Respond with mock data, causing Observable to resolve.
        request.graphqlErrors([new GraphQLError('Error making request')]);

        expect(component.loginActivity).toEqual(null);
      });
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
