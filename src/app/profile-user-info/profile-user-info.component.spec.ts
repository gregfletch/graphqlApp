import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingController, ApolloTestingModule, TestOperation } from 'apollo-angular/testing';
import faker from 'faker';
import { GraphQLError } from 'graphql';
import { userFactory } from 'src/app/factories/user';
import { User } from 'src/app/models/user';
import { GET_USER_INFO, UPDATE_USER_MUTATION } from 'src/app/profile/profile.component';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

import { ProfileUserInfoComponent } from './profile-user-info.component';

describe('ProfileUserInfoComponent', () => {
  let component: ProfileUserInfoComponent;
  let fixture: ComponentFixture<ProfileUserInfoComponent>;
  let apolloController: ApolloTestingController;
  const user: User = userFactory.build();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileUserInfoComponent],
      imports: [
        ApolloTestingModule,
        HttpClientTestingModule,
        MatCardModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        RouterTestingModule
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileUserInfoComponent);
    component = fixture.componentInstance;
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
        component.ngOnInit();

        const request: TestOperation = apolloController.expectOne(GET_USER_INFO);

        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            user: user
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
      component.ngOnInit();

      const request: TestOperation = apolloController.expectOne(GET_USER_INFO);

      request.graphqlErrors([new GraphQLError('Error making request')]);
      expect(component.user).toBeNull();
    });
  });

  describe('updateUser', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();

      const request: TestOperation = apolloController.expectOne(GET_USER_INFO);

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
        expect(request.operation.variables.firstName).toEqual('Updated');
        expect(request.operation.variables.lastName).toEqual('Modified');
        expect(component.loading).toBeTruthy();
      });

      describe('successfully sends update user mutation request', () => {
        let snackBar: MatSnackBar;

        beforeEach(() => {
          snackBar = TestBed.inject(MatSnackBar);
          spyOn(snackBar, 'openFromComponent');

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

        it('displays success snack bar message after successfully updating user information', () => {
          expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
          expect(snackBar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, { data: 'User information updated successfully', duration: 3500 });
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
});
