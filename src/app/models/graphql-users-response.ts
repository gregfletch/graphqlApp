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
