import { FastifyInstance, FastifyBaseLogger, FastifyTypeProviderDefault } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

export function ProjectsController(
  app: FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    FastifyBaseLogger,
    FastifyTypeProviderDefault
  >,
  _: Record<never, never>,
  done: (err?: Error) => void,
): void {
  app.get('/', async (req, res) => {
    res.send({ data: [] });
  });
  done();
}
