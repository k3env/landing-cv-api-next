import { FastifyInstance, FastifyBaseLogger, FastifyTypeProviderDefault } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

export function HealthController(
  app: FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    FastifyBaseLogger,
    FastifyTypeProviderDefault
  >,
  opts: Record<never, never>,
  done: (err?: Error) => void,
): void {
  app.get('/health', async (req, res) => {
    const result = await app.mongo.db?.command({
      ping: 1,
    });
    if (result) {
      res.send({ status: 'ready', ...result });
    } else {
      res.status(500).send({ status: 'not ready' });
    }
  });
  done();
}
