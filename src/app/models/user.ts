export interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
  email?: string;
  signInCount?: number;
  currentSignInAt?: string;
  lastSignInAt?: string;
  currentSignInIp?: string;
  lastSignInIp?: string;
  confirmed?: boolean;
}
