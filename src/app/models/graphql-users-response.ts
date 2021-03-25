import { User } from 'src/app/models/user';

export interface GraphqlUsersResponse {
  data: GraphqlUsersResponseObject;
}

interface GraphqlUsersResponseObject {
  users: Array<User>;
}

export interface GraphqlUserResponse {
  data: GraphqlUserResponseObject;
}

interface GraphqlUserResponseObject {
  user: User;
}

export interface GraphqlUpdateUserResponse {
  data: GraphqlUpdateUserResponseObject;
}

interface GraphqlUpdateUserResponseObject {
  updateUser: {
    errors: Array<string>;
    user: User | null;
  };
}

export interface GraphqlChangePasswordResponse {
  data: GraphqlChangePasswordResponseObject;
}

interface GraphqlChangePasswordResponseObject {
  changePassword: {
    errors: Array<string>;
    user: User | null;
  };
}

export interface GraphqlResetPasswordResponse {
  data: GraphqlResetPasswordResponseObject;
}

interface GraphqlResetPasswordResponseObject {
  resetPassword: {
    errors: Array<string>;
    user: User | null;
  };
}
