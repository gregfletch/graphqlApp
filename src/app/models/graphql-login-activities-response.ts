import { LoginActivity } from 'src/app/models/login-activity';

export interface GraphqlLoginActivitiesResponse {
  data: GraphqlLoginActivitiesResponseObject;
}

interface GraphqlLoginActivitiesResponseObject {
  loginActivities: LoginActivity;
}
