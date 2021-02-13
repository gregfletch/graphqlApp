import { Factory } from 'fishery';
import { LoginActivity } from 'src/app/models/login-activity';

export const loginActivityFactory = Factory.define<LoginActivity>(() => ({
  totalCount: 5,
  pageInfo: {
    endCursor: 'end',
    startCursor: 'start',
    hasNextPage: true,
    hasPreviousPage: true
  },
  edges: [
    {
      cursor: 'current',
      node: {
        id: 'abc_123'
      }
    }
  ]
}));
