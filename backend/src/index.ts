import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { useHive } from '@graphql-hive/apollo';
import cors from 'cors';
import express from 'express';

import { schema } from '@/schema';

import { GRAPHQL_HIVE_ACCESS_TOKEN } from './constants';
import { logger } from './logger';
import { buildContext, type Context } from './schema/context/context';
import { adMobWebhookRouter } from './webhooks/admob';

const PORT = Number(process.env.PORT) || 8080;

const app = express();
const server = new ApolloServer<Context>({
  schema,
  plugins: [
    useHive({
      enabled: true,
      token: GRAPHQL_HIVE_ACCESS_TOKEN,
      usage: {
        target: 'game-brain/game-brain/production',
      },
    }),
  ],
});

await server.start();

app.use(cors());
app.use(express.json());

app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello' });
});

app.use(adMobWebhookRouter);

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: ({ req }) => buildContext(req),
  }),
);

app.listen(PORT, () => {
  logger.info(
    `Server ready at http://localhost:${PORT} (GraphQL: /graphql, Hello: /hello, AdMob SSV: /ad-mob-verification)`,
  );
});
