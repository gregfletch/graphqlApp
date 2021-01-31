export interface PkceAuthorizationResponse {
  redirect_uri: {
    action: string;
    code: string;
  };
  status: string;
}
