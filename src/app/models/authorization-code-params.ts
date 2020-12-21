export interface AuthorizationCodeParams {
  client_id: string;
  response_code: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  redirect_uri: string;
}
