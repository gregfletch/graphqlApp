import { Factory } from 'fishery';
import { AccessTokenHeader, AccessTokenPayload } from 'src/app/models/access-token';
import { AuthToken } from 'src/app/models/auth-token';

const accessTokenHeader: AccessTokenHeader = { alg: 'HS256', kid: 'kid1', typ: 'JWT' };
const accessTokenPayload: AccessTokenPayload = {
  aud: 'http://audience.com',
  exp: 1610868061,
  iat: 1610853661,
  iss: 'http://issuer.com',
  jti: 'id1',
  scopes: 'api:graphql',
  sub: 'http://subscriber.com',
  user: {
    id: 'user1'
  }
};

export const authTokenFactory = Factory.define<AuthToken>(({ sequence }) => ({
  access_token: `${btoa(JSON.stringify(accessTokenHeader))}.${btoa(JSON.stringify(accessTokenPayload))}`,
  created_at: new Date().getTime() / 1000,
  expires_in: 60 * 60, // 1 hour expiry
  refresh_token: `refresh_token${sequence}`,
  scope: 'test:scope',
  token_type: 'Bearer'
}));
