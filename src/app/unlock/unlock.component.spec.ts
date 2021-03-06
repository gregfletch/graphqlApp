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
import { ErrorSnackbarComponent } from 'src/app/error-snackbar/error-snackbar.component';
import { userFactory } from 'src/app/factories/user';
import { SuccessSnackbarComponent } from 'src/app/success-snackbar/success-snackbar.component';

import { INITIATE_UNLOCK_PASSWORD_MUTATION, UNLOCK_PASSWORD_MUTATION, UnlockComponent } from './unlock.component';

describe('UnlockComponent', () => {
  let component: UnlockComponent;
  let fixture: ComponentFixture<UnlockComponent>;
  let apolloController: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnlockComponent],
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
    fixture = TestBed.createComponent(UnlockComponent);
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

  describe('ngOnInit', () => {
    it('unlockToken is empty string by default', () => {
      expect(component.unlockToken).toEqual('');
    });

    it('unlockToken is matches the provided query parameter', () => {
      const route: ActivatedRoute = TestBed.inject(ActivatedRoute);
      route.snapshot.queryParams = { unlockToken: 'abc123' };
      spyOn(component, 'unlockAccount');
      component.ngOnInit();

      expect(component.unlockToken).toEqual('abc123');
      expect(component.unlockAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('form validation', () => {
    it('is invalid by default', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('is valid if all required fields are filled', () => {
      component.form.setValue({ username: faker.internet.email() });
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
        component.form.setValue({ username: 'a@b.com' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if username field is too long', () => {
        component.form.setValue({ username: 'a'.repeat(256) });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['maxlength']).toBeTruthy();
        }
      });

      it('sets email error if username field is not an email', () => {
        component.form.setValue({ username: 'a' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['email']).toBeTruthy();
        }
      });
    });
  });

  describe('initiateUnlockAccount', () => {
    let request: TestOperation;
    let snackBar: MatSnackBar;

    beforeEach(() => {
      snackBar = TestBed.inject(MatSnackBar);
      spyOn(snackBar, 'openFromComponent');

      component.form.controls.username.setValue('john.doe@mail.com');

      component.initiateUnlockAccount();

      request = apolloController.expectOne(INITIATE_UNLOCK_PASSWORD_MUTATION);
      expect(request.operation.variables.email).toEqual('john.doe@mail.com');
      expect(component.loading).toBeTruthy();
    });

    describe('successfully sends initiate unlock account mutation request', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            unlockPassword: {
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

      it('displays success snack bar message after successfully sending unlock account instructions', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, { data: 'Password unlock instructions sent', duration: 3500 });
      });
    });

    describe('successfully sends initiate unlock account mutation request, error response', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            unlockPassword: {
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

    describe('network error on initiate unlock account mutation', () => {
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

  describe('unlockAccount', () => {
    let request: TestOperation;
    let snackBar: MatSnackBar;
    let router: Router;

    beforeEach(() => {
      snackBar = TestBed.inject(MatSnackBar);
      router = TestBed.inject(Router);
      const route: ActivatedRoute = TestBed.inject(ActivatedRoute);
      spyOn(snackBar, 'openFromComponent');
      spyOn(router, 'navigate');
      route.snapshot.queryParams = { unlockToken: faker.git.shortSha() };

      component.ngOnInit();

      request = apolloController.expectOne(UNLOCK_PASSWORD_MUTATION);
      expect(request.operation.variables.unlockToken).toEqual(component.unlockToken);
    });

    describe('successfully sends unlock account mutation request', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            unlockPassword: {
              user: {
                id: userFactory.build().id
              },
              errors: []
            }
          }
        });
      });

      it('displays success snack bar message after successfully unlocking account instructions', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, { data: 'Successfully unlocked account', duration: 3500 });
      });

      it('redirects to the root path on success', () => {
        expect(router.navigate).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });

    describe('successfully sends unlock account mutation request, error response', () => {
      beforeEach(() => {
        // Respond with mock data, causing Observable to resolve.
        request.flush({
          data: {
            unlockPassword: {
              user: {},
              errors: ['Unlock token is invalid']
            }
          }
        });
      });

      it('displays error snack bar message if response contains errors', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(ErrorSnackbarComponent, { data: 'Unlock token is invalid', duration: 3500 });
      });
    });

    describe('network error on unlock account mutation', () => {
      beforeEach(() => {
        request.networkError(new Error());
      });

      it('displays error snack bar message on network error', () => {
        expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackBar.openFromComponent).toHaveBeenCalledWith(ErrorSnackbarComponent, { data: 'Error sending request. Please try again.', duration: 3500 });
      });
    });
  });
});
