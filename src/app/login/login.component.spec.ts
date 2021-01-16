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
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import * as faker from 'faker';
import { EMPTY, of, throwError } from 'rxjs';
import { authTokenFactory } from 'src/app/factories/auth-token';
import { LoginComponent } from 'src/app/login/login.component';
import { AuthToken } from 'src/app/models/auth-token';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
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
      providers: [AuthService, UserService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('returnUrl is set to `/` if no returnUrl query params', () => {
    expect(component.returnUrl).toEqual('/');
  });

  it('returnUrl matches the provided query param value', () => {
    const route: ActivatedRoute = TestBed.inject(ActivatedRoute);
    route.snapshot.queryParams = { returnUrl: '/dashboard' };
    component.ngOnInit();

    expect(component.returnUrl).toEqual('/dashboard');
  });

  describe('ngOnInit', () => {
    let authService: AuthService;
    let router: Router;

    beforeEach(() => {
      authService = TestBed.inject(AuthService);
      router = TestBed.inject(Router);
    });

    it('calls refresh token if the user is authenticated and their token is expired', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(true);
      spyOn(authService, 'refreshToken').and.returnValue(EMPTY);

      component.ngOnInit();

      expect(authService.refreshToken).toHaveBeenCalled();
    });

    it('navigates to the redirect URL after successfully refreshing auth token', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(true);
      spyOn(authService, 'refreshToken').and.returnValue(of<AuthToken>(authTokenFactory.build()));
      spyOn(router, 'navigate');

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith([component.returnUrl]);
    });

    it('does not navigate if auth token refresh fails', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(true);
      spyOn(authService, 'refreshToken').and.returnValue(throwError(new HttpErrorResponse({ status: 400 })));
      spyOn(router, 'navigate');

      component.ngOnInit();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('does not call refresh token if the user is not authenticated', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);
      spyOn(authService, 'isTokenExpired').and.returnValue(true);
      spyOn(authService, 'refreshToken');

      component.ngOnInit();

      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('does not call refresh token if the user is authenticated and their token is not expired', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'isTokenExpired').and.returnValue(false);
      spyOn(authService, 'refreshToken');

      component.ngOnInit();

      expect(authService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('is invalid by default', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('is valid if all required fields are filled', () => {
      component.form.setValue({ username: faker.internet.email(), password: faker.internet.password() });
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
        component.form.setValue({ username: 'a@b.com', password: '' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if username field is too long', () => {
        component.form.setValue({ username: 'a'.repeat(256), password: '' });
        expect(component.form.controls.username.errors).not.toBeNull();

        if (component.form.controls.username.errors) {
          expect(component.form.controls.username.errors['maxlength']).toBeTruthy();
        }
      });

      it('sets email error if username field is not an email', () => {
        component.form.setValue({ username: 'a', password: '' });
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
        component.form.setValue({ username: '', password: 'abcdefg' });
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['minlength']).toBeTruthy();
        }
      });

      it('sets maxLength error if password field is too long', () => {
        component.form.setValue({ username: '', password: 'a'.repeat(129) });
        expect(component.form.controls.password.errors).not.toBeNull();

        if (component.form.controls.password.errors) {
          expect(component.form.controls.password.errors['maxlength']).toBeTruthy();
        }
      });
    });
  });

  describe('login', () => {
    let authService: AuthService;
    let router: Router;

    beforeEach(() => {
      authService = TestBed.inject(AuthService);
      router = TestBed.inject(Router);
    });

    it('does not attempt to login if form is invalid', () => {
      spyOn(authService, 'login');

      component.login();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('redirects to dashboard on successful login', () => {
      const authToken: AuthToken = authTokenFactory.build();
      spyOn(authService, 'login').and.returnValue(of(authToken));
      spyOn(router, 'navigate');

      component.form.setValue({ username: faker.internet.email(), password: faker.internet.password(8) });

      component.login();
      expect(router.navigate).toHaveBeenCalledWith([component.returnUrl]);
    });

    it('does not redirect on login error', () => {
      spyOn(authService, 'login').and.returnValue(throwError(new HttpErrorResponse({ status: 400 })));
      spyOn(router, 'navigate');

      component.form.setValue({ username: faker.internet.email(), password: faker.internet.password(8) });

      component.login();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('sets loading flag to false on login error', () => {
      spyOn(authService, 'login').and.returnValue(throwError(new HttpErrorResponse({ status: 400 })));
      spyOn(router, 'navigate');

      component.form.setValue({ username: faker.internet.email(), password: faker.internet.password(8) });

      component.login();
      expect(component.loading).toBeFalsy();
    });
  });
});
