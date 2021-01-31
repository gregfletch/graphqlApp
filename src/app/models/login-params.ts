export interface LoginParams {
  user: UserLoginParams;
}

interface UserLoginParams {
  [key: string]: string;
  email: string;
  password: string;
}
