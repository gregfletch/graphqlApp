import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthToken } from 'src/app/models/auth-token';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy, OnInit {
  loading = false;
  submitted = false;
  usernameTouched = false;
  passwordTouched = false;
  form!: FormGroup;
  returnUrl!: string;

  private destroyed$: Subject<void> = new Subject();

  constructor(private authService: AuthService, private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    if (this.authService.isAuthenticated() && this.authService.isTokenExpired()) {
      this.authService
        .refreshToken()
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          (_tokenResponse: AuthToken) => {
            this.router.navigate([this.returnUrl]);
          },
          (error: HttpErrorResponse) => {
            console.log('ERROR = ', error);
          }
        );
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  login(): void {
    this.submitted = true;

    // Don't bother trying to login if the form is invalid
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.authService
      .login(this.form.controls.username.value, this.form.controls.password.value)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (tokenResponse: AuthToken) => {
          console.log('TOKEN RESPONSE = ', tokenResponse);
          this.router.navigate([this.returnUrl]);
        },
        (error: HttpErrorResponse) => {
          // this.alertService.error(error);
          this.loading = false;
          console.log('ERROR = ', error);
        }
      );

    // const pkceParams: PkceParams = PkceUtils.pkceChallengeAndVerifier(128);
    // console.log('PKCE PARAMS = ', pkceParams);
    // this.userService
    //   .requestAuthorizationCode(pkceParams)
    //   .pipe(takeUntil(this.destroyed$))
    //   .subscribe(
    //     (data) => {
    //       console.log('DATA = ', data);
    //     },
    //     (error) => {
    //       console.log('ERROR = ', error);
    //     }
    //   );
  }
}
