import * as faker from 'faker';

import { Factory } from 'fishery';
import { RegisterParams } from 'src/app/models/register-params';

export const registerParamsFactory = Factory.define<RegisterParams>(() => ({
  user: {
    email: faker.internet.email(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    password: faker.internet.password()
  }
}));
