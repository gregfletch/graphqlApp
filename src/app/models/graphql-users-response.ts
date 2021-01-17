import { User } from 'src/app/models/user';

export interface GraphqlUsersResponse {
  data: GraphqlUsersResponseObject;
}

interface GraphqlUsersResponseObject {
  users: Array<User>;
}
