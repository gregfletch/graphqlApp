import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RegisterParams } from 'src/app/models/register-params';
import { RestResponse } from 'src/app/models/rest-response';
import { User } from 'src/app/models/user';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public user: User | null = null;

  constructor(private httpClient: HttpClient) {}

  register(firstName: string, lastName: string, username: string, password: string): Observable<RestResponse> {
    const registerParams: RegisterParams = {
      user: {
        email: username,
        first_name: firstName,
        last_name: lastName,
        password: password
      }
    };
    const url: string = environment.idp_base_url + '/users';
    return this.httpClient.post(url, registerParams);
  }
}
