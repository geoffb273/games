import { builder } from './builder';

import './errors';
import './health';
import './user';
import './puzzle';

export const schema = builder.toSchema();
