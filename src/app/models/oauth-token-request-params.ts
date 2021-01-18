export interface OauthTokenRequestParams {
  [key: string]: string;
  client_id: string;
  email: string;
  grant_type: GrantType;
  password: string;
}

export interface OauthTokenRefreshRequestParams {
  [key: string]: string;
  grant_type: GrantType.refresh_token;
  refresh_token: string;
  client_id: string;
}

export enum GrantType {
  authorization_code = 'authorization_code',
  client_credentials = 'client_credentials',
  password = 'password',
  refresh_token = 'refresh_token'
}
