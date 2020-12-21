import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthToken } from 'src/app/models/auth-token';
import { RestResponse } from 'src/app/models/rest-response';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

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

  constructor(private authService: AuthService, private formBuilder: FormBuilder, private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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
          // this.router.navigate([this.returnUrl]);
          console.log('TOKEN RESPONSE = ', tokenResponse);
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
