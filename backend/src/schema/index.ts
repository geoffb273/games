import './errors';
import './health';

import { builder } from './builder';

export const schema = builder.toSchema();
