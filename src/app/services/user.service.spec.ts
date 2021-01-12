import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { registerParamsFactory } from 'src/app/factories/register-params';
import { RegisterParams } from 'src/app/models/register-params';
import { RestResponse } from 'src/app/models/rest-response';

import { UserService } from 'src/app/services/user.service';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    const registerParams: RegisterParams = registerParamsFactory.build();

    beforeEach(() => {
      httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('returns a success response on successful registration', () => {
      const expectedResponse: RestResponse = {
        result: {
          message: 'Success!'
        }
      };

      service
        .register(registerParams.user.first_name, registerParams.user.last_name, registerParams.user.email, registerParams.user.password)
        .subscribe((response: RestResponse) => {
          expect(response).toEqual(expectedResponse);
        });

      const req = httpTestingController.expectOne('http://idp.app.lvh.me:3000/users');
      expect(req.request.method).toEqual('POST');

      req.flush(expectedResponse);
    });

    it('returns an error response on error', () => {
      service.register(registerParams.user.first_name, registerParams.user.last_name, registerParams.user.email, registerParams.user.password).subscribe(
        (_response: RestResponse) => {
          fail('Unexpected success');
        },
        (error: HttpErrorResponse) => {
          expect(error.status).toEqual(400);
        }
      );

      const req = httpTestingController.expectOne('http://idp.app.lvh.me:3000/users');
      expect(req.request.method).toEqual('POST');

      req.error(new ErrorEvent('HttpErrorResponse'), { status: 400 });
    });
  });
});
