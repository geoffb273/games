import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { useHive } from '@graphql-hive/apollo';
import cors from 'cors';
import express from 'express';

import { schema } from '@/schema';

import { GRAPHQL_HIVE_ACCESS_TOKEN } from './constants';
import { logger } from './logger';
import { buildContext, type Context } from './schema/context/context';
import { AdMobSsvVerificationError } from './schema/errors';
import { verifyAdMobSsvQueryString } from './utils/adMob/verify';

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

app.get('/ad-mob-verification', async (req, res) => {
  const q = req.originalUrl.indexOf('?');

  const rawQuery = q === -1 ? '' : req.originalUrl.slice(q + 1);

  if (!rawQuery) {
    logger.warn('AdMob SSV verification failed: Missing query string');
    res.status(400).json({ error: 'Missing query string' });
    return;
  }

  try {
    await verifyAdMobSsvQueryString(rawQuery);
    logger.info('AdMob SSV verification successful');
    res.status(200).json({ ok: true });
  } catch (err) {
    logger.error(err, 'AdMob SSV verification failed');
    if (err instanceof AdMobSsvVerificationError) {
      res.status(403).json({ error: 'Verification failed' });
      return;
    }

    res.status(500).json({ error: 'Internal error' });
  }
});

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: ({ req }) => buildContext(req),
  }),
);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console -- server startup
  console.log(
    `Server ready at http://localhost:${PORT} (GraphQL: /graphql, Hello: /hello, AdMob SSV: /ad-mob-verification)`,
  );
});
