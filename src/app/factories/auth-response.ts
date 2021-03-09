import { Factory } from 'fishery';
import { AuthResponse } from 'src/app/models/auth-response';

export const authResponseFactory = Factory.define<AuthResponse>(({ sequence }) => ({
  errors: [],
  result: {
    message: 'Success',
    user: {
      id: sequence.toString(),
      session_id: sequence.toString()
    }
  }
}));
