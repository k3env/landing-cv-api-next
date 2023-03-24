import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import * as dotenv from 'dotenv';
import { fastifyMongodb } from '@fastify/mongodb';

dotenv.config();

export async function main(): Promise<void> {
  const app = fastify({ logger: true });
  app.register(fastifyMongodb, { url: process.env.MONGO_URI, forceClose: true });
  app.register(fastifyCors, { origin: '*' });

  app.all('/', (req, res) => {
    res.send({ hello: 'world' });
  });
  app.listen(
    { port: Number.parseInt(process.env.APP_PORT ?? '3000'), host: process.env.APP_HOST ?? '127.0.0.1' },
    (e) => {
      if (e) throw e;
    },
  );
}

main();
