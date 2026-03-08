import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express from 'express';

import { schema } from '@/schema';

import { buildContext, type Context } from './schema/context/context';

const PORT = Number(process.env.PORT) || 4000;

const app = express();
const server = new ApolloServer<Context>({ schema });

await server.start();

app.use(cors());
app.use(express.json());

app.get('/hello', (_req, res) => {
  console.log('HELLO');
  res.json({ message: 'Hello' });
});

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: ({ req }) => buildContext(req),
  }),
);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console -- server startup
  console.log(`Server ready at http://localhost:${PORT} (GraphQL: /graphql, Hello: /hello)`);
  console.log('HELLO SERVER');
});
