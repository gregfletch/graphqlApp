import { Factory } from 'fishery';

import * as faker from 'faker';

import { User } from 'src/app/models/user';

export const userFactory = Factory.define<User>(() => ({
  confirmed: true,
  currentSignInAt: new Date().toISOString(),
  currentSignInIp: faker.internet.ip(),
  email: faker.internet.email(),
  firstName: faker.name.firstName(),
  id: 'user1',
  lastName: faker.name.lastName(),
  lastSignInAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  lastSignInIp: faker.internet.ip()
}));
