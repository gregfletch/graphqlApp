export interface LoginParams {
  user: UserLoginParams;
}

interface UserLoginParams {
  email: string;
  password: string;
}
