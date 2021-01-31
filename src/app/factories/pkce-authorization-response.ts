import { Factory } from 'fishery';
import { PkceAuthorizationResponse } from 'src/app/models/pkce-authorization-response';

export const pkceAuthorizationResponse = Factory.define<PkceAuthorizationResponse>(({ sequence }) => ({
  redirect_uri: {
    code: `authCode${sequence}`,
    action: 'redirect'
  },
  status: 'redirect'
}));
