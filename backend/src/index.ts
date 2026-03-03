import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { schema } from '@/schema';

import { buildContext, type Context } from './schema/context/context';

const PORT = Number(process.env.PORT) || 4000;

const server = new ApolloServer<Context>({ schema });

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT },
  context: ({ req }) => buildContext(req),
});

console.log(`Server ready at ${url}`);
