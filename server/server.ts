import express from 'express';
import * as path from 'path';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './schema/typeDefs';
import resolvers from './schema/resolvers';
import { authMiddleware } from './util/auth';
import { DocumentNode } from 'graphql';
import { PORT } from './config/consts';
import db from './config/connection';

// create the express server
const app = express();

// create the graphql server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});

// basic middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// redirect all gets in production to be handled by react router
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../src/client/build')));
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/client/build/index.html'));
  });
}

/**
 * The start function for the server
 * @param typedefs
 * @param resolvers
 */
const start = async (typedefs: DocumentNode, resolvers: any) => {
  // start the graphql server
  await server.start();

  // allow our app to be added
  server.applyMiddleware({ app });

  // start listening on the connection
  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
      console.log(
        `Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`
      );
    });
  });
};

// set up complete time to run the server
start(typeDefs, resolvers);
