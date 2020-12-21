export interface OauthTokenRequestParams {
  [key: string]: string;
  client_id: string;
  email: string;
  grant_type: GrantType;
  password: string;
}

export enum GrantType {
  authorization_code = 'authorization_code',
  client_credentials = 'client_credentials',
  password = 'password'
}
