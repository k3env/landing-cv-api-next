import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import * as dotenv from 'dotenv';
import { fastifyMongodb } from '@fastify/mongodb';
import fastifyStatic from '@fastify/static';
import { ProfileController, FilesController } from './controllers';
import fastifyMultipart from '@fastify/multipart';

dotenv.config();

export async function main(): Promise<void> {
  const app = fastify({ logger: true });
  const asset_path = new URL(process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000/public').pathname;
  app.register(fastifyMongodb, { url: process.env.MONGO_URI, forceClose: true });
  app.register(fastifyCors, { origin: '*' });
  app.register(fastifyMultipart);
  app.register(fastifyStatic, { root: process.cwd() + '/public', serve: true, prefix: asset_path });

  app.all('/', (req, res) => {
    res.send({ hello: 'world' });
  });
  app.register(ProfileController, { prefix: '/api/v1/profile' });
  app.register(FilesController, { prefix: '/api/v1/files' });
  app.listen(
    { port: Number.parseInt(process.env.APP_PORT ?? '3000'), host: process.env.APP_HOST ?? '127.0.0.1' },
    (e) => {
      if (e) throw e;
    },
  );
}

main();
