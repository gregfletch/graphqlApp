import { Factory } from 'fishery';
import { AuthToken } from 'src/app/models/auth-token';

export const authTokenFactory = Factory.define<AuthToken>(({ sequence }) => ({
  access_token: `access_token${sequence}`,
  created_at: new Date().getTime() / 1000,
  expires_in: 60 * 60, // 1 hour expiry
  refresh_token: `refresh_token${sequence}`,
  scope: 'test:scope',
  token_type: 'Bearer'
}));
