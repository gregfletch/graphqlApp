export interface AccessToken {
  header: AccessTokenHeader;
  payload: AccessTokenPayload;
}

export interface AccessTokenHeader {
  alg: 'HS256' | 'RS256';
  kid: string;
  typ: 'JWT';
}

export interface AccessTokenPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  scopes: string;
  sub: string;
  user: AccessTokenUser;
}

interface AccessTokenUser {
  id: string;
}
