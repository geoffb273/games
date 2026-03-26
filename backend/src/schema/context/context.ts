import { type IncomingMessage } from 'http';
import { type Logger } from 'pino';

import { logger } from '@/logger';
import { createDataloaders, type Dataloaders } from '@/schema/dataloader';

import { type Authorization, buildAuthorization } from './authorization';

export type Context = {
  authorization: Authorization;
  dataloaders: Dataloaders;
  logger: Logger;
};

export async function buildContext(req: IncomingMessage): Promise<Context> {
  const authorization = buildAuthorization(req);

  return { authorization, dataloaders: createDataloaders(authorization), logger };
}
