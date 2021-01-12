import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RestResponse } from 'src/app/models/rest-response';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnDestroy, OnInit {
  loading = false;
  submitted = false;
  usernameTouched = false;
  passwordTouched = false;
  firstNameTouched = false;
  lastNameTouched = false;
  form!: FormGroup;

  private destroyed$: Subject<void> = new Subject();

  constructor(private userService: UserService, private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', Validators.required],
      username: ['', Validators.required]
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  register(): void {
    this.submitted = true;

    // Don't bother trying to login if the form is invalid
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.userService
      .register(this.form.controls.firstName.value, this.form.controls.lastName.value, this.form.controls.username.value, this.form.controls.password.value)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (data: RestResponse) => {
          console.log('DATA = ', data);
          this.router.navigate(['']);
        },
        (error: HttpErrorResponse) => {
          this.loading = false;
          console.log('ERROR = ', error);
        }
      );
  }
}
