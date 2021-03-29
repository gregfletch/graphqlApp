import { LoginActivity } from 'src/app/models/login-activity';

export interface User {
  confirmed?: boolean;
  createdAt?: string;
  currentSignInAt?: string;
  currentSignInIp?: string;
  email?: string;
  firstName?: string;
  fullName?: string;
  id: string;
  lastName?: string;
  lastSignInAt?: string;
  lastSignInIp?: string;
  loginActivities?: Array<LoginActivity>;
  sessionId?: string;
  signInCount?: number;
  updatedAt?: string;
  username?: string;
}
