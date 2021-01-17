import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { authTokenFactory } from 'src/app/factories/auth-token';
import { AuthService } from 'src/app/services/auth.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    const fixture: ComponentFixture<AppComponent> = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'graphqlApp'`, () => {
    expect(component.title).toEqual('graphqlApp');
  });

  describe('isAuthenticated', () => {
    let authService: AuthService;

    beforeEach(() => {
      authService = TestBed.inject(AuthService);
    });

    it('returns false if user is not authenticated', () => {
      jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(null);
      expect(component.isAuthenticated).toBeFalsy();
    });

    it('returns true if user is authenticated', () => {
      jest.spyOn(authService, 'authTokenValue', 'get').mockReturnValue(authTokenFactory.build());
      expect(component.isAuthenticated).toBeTruthy();
    });
  });
});
