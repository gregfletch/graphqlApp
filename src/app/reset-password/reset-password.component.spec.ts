import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingController, ApolloTestingModule, TestOperation } from 'apollo-angular/testing';
import faker from 'faker';
import { of } from 'rxjs';
import { ErrorSnackbarComponent } from 'src/app/error-snackbar/error-snackbar.component';
import { authTokenFactory } from 'src/app/factories/auth-token';
import { userFactory } from 'src/app/factories/user';
import { AuthService } from 'src/app/services/auth.service';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

import { INITIATE_RESET_PASSWORD_MUTATION, RESET_PASSWORD_MUTATION, ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let apolloController: ApolloTestingController;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResetPasswordComponent],
      imports: [
        ApolloTestingModule,
        HttpClientTestingModule,
        MatButtonModule,
        MatCardModule,
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
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    apolloController = TestBed.inject(ApolloTestingController);
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => {
    apolloController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('resetToken is empty string by default', () => {
      expect(component.resetToken).toEqual('');
    });

    it('resetToken is matches the provided query parameter', () => {
      const route: ActivatedRoute = TestBed.inject(ActivatedRoute);
      route.snapshot.queryParams = { resetToken: 'abc123' };
      component.ngOnInit();

      expect(component.resetToken).toEqual('abc123');
    });
  });

  describe('form validation', () => {
    it('is invalid by default', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('is valid if all required fields are filled', () => {
      component.form.setValue({ username: faker.internet.email(), password: faker.internet.password(8) });
      expect(component.form.valid).toBeTruthy();
    });

    describe('username field', () => {
      it('sets required error if username field is blank', () => {
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if username field is too short', () => {
        component.form.setValue({ username: 'a@b.com', password: faker.internet.password(8) });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if username field is too long', () => {
        component.form.setValue({ username: 'a'.repeat(256), password: faker.internet.password(8) });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['maxlength']).toBeTruthy();
        }
      });

      it('sets email error if username field is not an email', () => {
        component.form.setValue({ username: 'a', password: faker.internet.password(8) });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['email']).toBeTruthy();
        }
      });
    });

    describe('password field', () => {
      beforeEach(() => {
        spyOn(component, 'resetToken').and.returnValue(faker.git.shortSha());
        fixture.detectChanges();
      });

      it('sets required error if password field is blank', () => {
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if password field is too short', () => {
        component.form.setValue({ username: faker.internet.email(), password: faker.internet.password(7) });
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if password field is too long', () => {
        component.form.setValue({ username: faker.internet.email(), password: faker.internet.password(129) });
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['maxlength']).toBeTruthy();
        }
      });
    });
  });

  describe('submitResetForm', () => {
    beforeEach(() => {
      spyOn(component, 'initiateResetPassword');
      spyOn(component, 'resetPassword');
    });

    it('submit form calls initiateResetPassword if resetToken is not set', () => {
      component.submitResetForm();
      expect(component.initiateResetPassword).toHaveBeenCalled();
    });

    it('submit form calls resetPassword if resetToken is set', () => {
      spyOn(component, 'resetToken').and.returnValue(faker.git.shortSha());
      component.submitResetForm();
      expect(component.resetPassword).toHaveBeenCalled();
    });
  });

  describe('initiateResetPassword', () => {
    let request: TestOperation;
    let snackBar: MatSnackBar;

    beforeEach(() => {
      snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'openFromComponent');

      component.form.controls.username.setValue('john.doe@mail.com');

      component.initiateResetPassword();

      request = apolloController.expectOne(INITIATE_RESET_PASSWORD_MUTATION);
      expect(request.operation.variables.email).toEqual('john.doe@mail.com');
      expect(component.loading).toBeTruthy();
    });

    describe('successfully sends initiate reset password mutation request', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            resetPassword: {
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
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, { data: 'Password reset instructions sent', duration: 3500 });
      });
    });

    describe('successfully sends initiate reset password mutation request, error response', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            resetPassword: {
              user: {},
              errors: ['Unknown user email address']
            }
          }
        });
      });

      it('displays error snack bar message if response contains errors', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(ErrorSnackbarComponent, { data: 'Unknown user email address', duration: 3500 });
      });
    });

    describe('network error on initiate reset password mutation', () => {
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

  describe('resetPassword', () => {
    let request: TestOperation;
    let snackBar: MatSnackBar;
    const sessionId: string = faker.git.shortSha();
    let router: Router;

    beforeEach(() => {
      snackBar = TestBed.inject(MatSnackBar);
      router = TestBed.inject(Router);
      spyOn(snackBar, 'openFromComponent');
      spyOn(component, 'resetToken').and.returnValue(sessionId);
      spyOn(authService, 'pkceAuthToken').and.returnValue(of(authTokenFactory.build()));
      spyOn(router, 'navigate');

      component.form.controls.password.setValue('Password1');

      component.resetPassword();

      request = apolloController.expectOne(RESET_PASSWORD_MUTATION);
      expect(request.operation.variables.password).toEqual('Password1');
      expect(request.operation.variables.resetToken).toEqual(component.resetToken);
      expect(component.loading).toBeTruthy();
    });

    describe('successfully sends reset password mutation request', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            resetPassword: {
              user: {
                id: userFactory.build().id,
                sessionId: sessionId
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
        expect(snackBar.openFromComponent).toHaveBeenCalled();
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, { data: 'Successfully reset password', duration: 3500 });
      });

      it('gets an auth token to login after resetting the password', () => {
        expect(authService.pkceAuthToken).toHaveBeenCalledTimes(1);
        expect(authService.pkceAuthToken).toHaveBeenCalledWith('', sessionId);
      });

      it('redirects to the dashboard after resetting the password and retrieving a new auth token', () => {
        expect(router.navigate).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });

    describe('successfully sends reset password mutation, no user object in response', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            resetPassword: {
              errors: []
            }
          }
        });
      });

      it('does not attempt to get a new auth token', () => {
        expect(authService.pkceAuthToken).not.toHaveBeenCalled();
      });
    });

    describe('successfully sends reset password mutation, no sessionId in user object in response', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            resetPassword: {
              user: {
                id: userFactory.build().id
              },
              errors: []
            }
          }
        });
      });

      it('does not attempt to get a new auth token', () => {
        expect(authService.pkceAuthToken).not.toHaveBeenCalled();
      });
    });

    describe('successfully sends reset password mutation request, error response', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            resetPassword: {
              user: {},
              errors: ['Unknown user email address']
            }
          }
        });
      });

      it('displays error snack bar message if response contains errors', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalled();
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(ErrorSnackbarComponent, { data: 'Unknown user email address', duration: 3500 });
      });
    });

    describe('network error on reset password mutation', () => {
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
