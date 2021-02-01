import { LayoutModule } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [NavComponent],
        imports: [
          HttpClientTestingModule,
          LayoutModule,
          MatButtonModule,
          MatIconModule,
          MatListModule,
          MatSidenavModule,
          MatToolbarModule,
          NoopAnimationsModule,
          RouterTestingModule
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  describe('logout', () => {
    let authService: AuthService;
    let router: Router;
    let logoutSpy: jasmine.Spy;

    beforeEach(() => {
      authService = TestBed.inject(AuthService);
      router = TestBed.inject(Router);

      logoutSpy = spyOn(authService, 'logout');
      spyOn(router, 'navigate');
    });

    it('navigates back to the login page on success', () => {
      logoutSpy.and.returnValue(of({}));
      component.logout();

      expect(router.navigate).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('does not navigate away on error', () => {
      logoutSpy.and.returnValue(throwError(new HttpErrorResponse({ status: 400 })));
      component.logout();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
