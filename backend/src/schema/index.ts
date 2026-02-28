import { builder } from './builder';

import './errors';
import './health';
import './user';

export const schema = builder.toSchema();
