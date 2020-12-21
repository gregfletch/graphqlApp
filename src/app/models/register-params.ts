export interface RegisterParams {
  user: UserRegisterParams;
}

export interface UserRegisterParams {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}
