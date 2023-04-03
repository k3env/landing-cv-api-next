import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import * as dotenv from 'dotenv';
import { fastifyMongodb } from '@fastify/mongodb';
import fastifyStatic from '@fastify/static';
import { ProfileController, FilesController, TagsController, ProjectsController } from './controllers';
import fastifyMultipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import { importJWK, KeyLike } from 'jose';

dotenv.config();

export async function main(): Promise<void> {
  const app = fastify({ logger: true });

  const { PUBLIC_BASE_URL, JWK_URL, MONGO_URI, APP_PORT, APP_HOST } = process.env;

  const assetURL = new URL(PUBLIC_BASE_URL ?? 'http://localhost:3000/public');
  const appPort = Number.parseInt(APP_PORT ?? '3000');
  const appHost = APP_HOST ?? '127.0.0.1';

  if (!MONGO_URI) {
    console.log("MONGO_URI isn't set");
    return;
  }

  if (!JWK_URL) {
    console.log("JWK_URL isn't set");
    return;
  }

  const publicKey: KeyLike = (await importJWK(await (await fetch(JWK_URL)).json(), 'RS256')) as KeyLike;

  app.register(fastifyMongodb, { url: MONGO_URI, forceClose: true });
  app.register(fastifyCors, { origin: true, credentials: true });
  app.register(fastifyMultipart);
  app.register(fastifyCookie);
  app.register(fastifyStatic, { root: process.cwd() + '/public', serve: true, prefix: assetURL.pathname });

  app.all('/', (req, res) => {
    res.send({ hello: 'world' });
  });
  app.register(ProfileController, { pubKey: publicKey, assetPath: assetURL, prefix: '/api/v1/profile' });
  app.register(FilesController, { pubKey: publicKey, assetPath: assetURL, prefix: '/api/v1/files' });
  app.register(TagsController, { pubKey: publicKey, assetPath: assetURL, prefix: '/api/v1/tags' });
  app.register(ProjectsController, { pubKey: publicKey, assetPath: assetURL, prefix: '/api/v1/projects' });
  app.listen({ port: appPort, host: appHost }, (e) => {
    if (e) throw e;
  });
  const stop = (): void => {
    console.log();
    app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    stop();
  }); // CTRL+C
  process.on('SIGQUIT', () => {
    stop();
  }); // Keyboard quit
  process.on('SIGTERM', () => {
    stop();
  }); // `kill` command
}

main();
