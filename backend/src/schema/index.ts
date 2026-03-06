import { builder } from './builder';

import './errors';
import './user';
import './puzzle';
import './dailyChallenge';

export const schema = builder.toSchema();
