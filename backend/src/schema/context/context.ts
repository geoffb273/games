import { type IncomingMessage } from 'http';

import { createDataloaders, type Dataloaders } from '@/schema/dataloader';

import { type Authorization, buildAuthorization } from './authorization';

export type Context = {
  authorization: Authorization;
  dataloaders: Dataloaders;
};

export async function buildContext(req: IncomingMessage): Promise<Context> {
  const authorization = buildAuthorization(req);
  return { authorization, dataloaders: createDataloaders(authorization) };
}
