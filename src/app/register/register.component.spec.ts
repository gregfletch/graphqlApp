import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import * as faker from 'faker';
import { of, throwError } from 'rxjs';
import { RestResponse } from 'src/app/models/rest-response';

import { UserService } from 'src/app/services/user.service';
import { RegisterComponent } from 'src/app/register/register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [
        HttpClientTestingModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [UserService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        username: faker.internet.email(),
        password: faker.internet.password()
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
        component.form.setValue({ firstName: 'a', lastName: '', username: '', password: '' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.firstName.errors) {
          expect(component.form.controls.firstName.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if firstName field is too long', () => {
        component.form.setValue({ firstName: 'a'.repeat(129), lastName: '', username: '', password: '' });
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
        component.form.setValue({ firstName: '', lastName: 'a', username: '', password: '' });
        expect(component.form.controls.lastName.errors).not.toBeNull();

        if (component.form.controls.lastName.errors) {
          expect(component.form.controls.lastName.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if lastName field is too long', () => {
        component.form.setValue({ firstName: '', lastName: 'a'.repeat(129), username: '', password: '' });
        expect(component.form.controls.lastName.errors).not.toBeNull();

        if (component.form.controls.lastName.errors) {
          expect(component.form.controls.lastName.errors['maxlength']).toBeTruthy();
        }
      });
    });

    describe('username field', () => {
      it('sets required error if username field is blank', () => {
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if username field is too short', () => {
        component.form.setValue({ firstName: '', lastName: '', username: 'a@b.com', password: '' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if username field is too long', () => {
        component.form.setValue({ firstName: '', lastName: '', username: 'a'.repeat(256), password: '' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['maxlength']).toBeTruthy();
        }
      });

      it('sets email error if username field is not an email', () => {
        component.form.setValue({ firstName: '', lastName: '', username: 'a', password: '' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['email']).toBeTruthy();
        }
      });
    });

    describe('password field', () => {
      it('sets required error if password field is blank', () => {
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['required']).toBeTruthy();
        }
      });

      it('sets minLength error if password field is too short', () => {
        component.form.setValue({ firstName: '', lastName: '', username: '', password: 'abcdefg' });
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if password field is too long', () => {
        component.form.setValue({ firstName: '', lastName: '', username: '', password: 'a'.repeat(129) });
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['maxlength']).toBeTruthy();
        }
      });
    });
  });

  describe('register', () => {
    let userService: UserService;
    let router: Router;

    beforeEach(() => {
      userService = TestBed.inject(UserService);
      router = TestBed.inject(Router);
    });

    it('does not attempt to register if form is invalid', () => {
      spyOn(userService, 'register');

      component.register();
      expect(userService.register).not.toHaveBeenCalled();
    });

    it('redirects to root route on successful registration', () => {
      const response: RestResponse = {
        result: {
          message: 'Success'
        },
        errors: []
      };
      spyOn(userService, 'register').and.returnValue(of(response));
      spyOn(router, 'navigate');

      component.form.setValue({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        username: faker.internet.email(),
        password: faker.internet.password(8)
      });

      component.register();
      expect(router.navigate).toHaveBeenCalledWith(['']);
    });

    it('does not redirect on register error', () => {
      spyOn(userService, 'register').and.returnValue(throwError(new HttpErrorResponse({ status: 400 })));
      spyOn(router, 'navigate');

      component.form.setValue({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        username: faker.internet.email(),
        password: faker.internet.password(8)
      });

      component.register();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('sets loading flag to false on register error', () => {
      spyOn(userService, 'register').and.returnValue(throwError(new HttpErrorResponse({ status: 400 })));
      spyOn(router, 'navigate');

      component.form.setValue({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        username: faker.internet.email(),
        password: faker.internet.password(8)
      });

      component.register();
      expect(component.loading).toBeFalsy();
    });
  });
});
