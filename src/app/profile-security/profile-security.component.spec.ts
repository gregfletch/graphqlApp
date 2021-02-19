import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { ErrorSnackbarComponent } from 'src/app/error-snackbar/error-snackbar.component';
import { userFactory } from 'src/app/factories/user';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

import { CHANGE_PASSWORD_MUTATION, ProfileSecurityComponent } from './profile-security.component';

describe('ProfileSecurityComponent', () => {
  let component: ProfileSecurityComponent;
  let fixture: ComponentFixture<ProfileSecurityComponent>;
  let apolloController: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileSecurityComponent],
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
    fixture = TestBed.createComponent(ProfileSecurityComponent);
    component = fixture.componentInstance;
    apolloController = TestBed.inject(ApolloTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    apolloController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('is invalid by default', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('is valid if all required fields are filled', () => {
      component.form.setValue({
        currentPassword: faker.internet.password(),
        newPassword: 'NewPassword'
      });
      expect(component.form.valid).toBeTruthy();
    });

    describe('current password', () => {
      it('sets required error if currentPassword field is blank', () => {
        expect(component.form.controls.currentPassword.errors).not.toBeNull();

        if (component.form.controls.currentPassword.errors) {
          expect(component.form.controls.currentPassword.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if currentPassword field is too short', () => {
        component.form.setValue({ currentPassword: 'a', newPassword: '' });
        expect(component.form.controls.currentPassword.errors).not.toBeNull();

        if (component.form.controls.currentPassword.errors) {
          expect(component.form.controls.currentPassword.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if currentPassword field is too long', () => {
        component.form.setValue({ currentPassword: 'a'.repeat(129), newPassword: '' });
        expect(component.form.controls.currentPassword.errors).not.toBeNull();

        if (component.form.controls.currentPassword.errors) {
          expect(component.form.controls.currentPassword.errors['maxlength']).toBeTruthy();
        }
      });
    });

    describe('new password', () => {
      it('sets required error if newPassword field is blank', () => {
        expect(component.form.controls.newPassword.errors).not.toBeNull();

        if (component.form.controls.newPassword.errors) {
          expect(component.form.controls.newPassword.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if newPassword field is too short', () => {
        component.form.setValue({ currentPassword: '', newPassword: 'a' });
        expect(component.form.controls.newPassword.errors).not.toBeNull();

        if (component.form.controls.newPassword.errors) {
          expect(component.form.controls.newPassword.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if newPassword field is too long', () => {
        component.form.setValue({ currentPassword: '', newPassword: 'a'.repeat(129) });
        expect(component.form.controls.newPassword.errors).not.toBeNull();

        if (component.form.controls.newPassword.errors) {
          expect(component.form.controls.newPassword.errors['maxlength']).toBeTruthy();
        }
      });

      it('sets uniqueness error if newPassword is equal to currentPassword', () => {
        component.form.setValue({ currentPassword: 'Password1', newPassword: 'Password1' });
        expect(component.form.controls.newPassword.errors).not.toBeNull();

        if (component.form.controls.newPassword.errors) {
          expect(component.form.controls.newPassword.errors['uniqueness']).toBeTruthy();
        }
      });

      it('clears uniqueness error if newPassword is updated to no equal currentPassword', () => {
        component.form.setValue({ currentPassword: 'Password1', newPassword: 'Password1' });
        expect(component.form.controls.newPassword.errors).not.toBeNull();

        if (component.form.controls.newPassword.errors) {
          expect(component.form.controls.newPassword.errors['uniqueness']).toBeTruthy();
        }

        component.form.setValue({ currentPassword: 'Password1', newPassword: 'NewPassword' });
        expect(component.form.controls.newPassword.errors).toBeNull();
      });
    });
  });

  describe('changePassword', () => {
    let request: TestOperation;
    let snackBar: MatSnackBar;

    beforeEach(() => {
      snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'openFromComponent');

      component.form.controls.currentPassword.setValue('currentPassword');
      component.form.controls.newPassword.setValue('newPassword');

      component.changePassword();

      request = apolloController.expectOne(CHANGE_PASSWORD_MUTATION);
      expect(request.operation.variables.currentPassword).toEqual('currentPassword');
      expect(request.operation.variables.password).toEqual('newPassword');
      expect(component.loading).toBeTruthy();
    });

    describe('successfully sends change password mutation request', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            changePassword: {
              user: {
                id: userFactory.build().id
              },
              errors: []
            }
          }
        });
      });

      it('clears loading flag after response returned', () => {
        expect(component.loading).toBeFalsy();
      });

      it('displays success snack bar message after successfully changing password', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, { data: 'Password updated successfully', duration: 3500 });
      });
    });

    describe('successfully sends change password mutation request, error response', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            changePassword: {
              user: {},
              errors: ['New password is invalid.']
            }
          }
        });
      });

      it('displays error snack bar message if response contains errors', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(ErrorSnackbarComponent, { data: 'New password is invalid.', duration: 3500 });
      });
    });

    describe('network error on change password mutation', () => {
      beforeEach(() => {
        request.networkError(new Error());
      });

      it('disabled loading flag if an error response is returned', () => {
        expect(component.loading).toBeFalsy();
      });

      it('displays error snack bar message on network error', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(ErrorSnackbarComponent, { data: 'Error sending request. Please try again.', duration: 3500 });
      });
    });
  });
});
