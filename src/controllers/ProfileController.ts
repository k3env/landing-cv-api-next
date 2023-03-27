import { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest, FastifyTypeProviderDefault } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Profile } from '../models/Profile.model';

export function ProfileController(
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
  app.get('/', async function (req: FastifyRequest, res: FastifyReply) {
    const profile = await app.mongo.db?.collection<Profile>('profile').findOne();
    res.send({ data: profile });
  });
  app.post('/', async (req: FastifyRequest, res: FastifyReply) => {
    const collection = app.mongo.db?.collection<Profile>('profile');
    if (collection) {
      const profile = await collection.findOne();
      const update = req.body as Profile & { _id: string | undefined };
      if (profile === null) {
        const value = await collection.insertOne(update as Profile);
        res.send(value);
      } else {
        delete update._id;
        const value = await collection.replaceOne({ _id: profile._id }, { ...profile, ...update });
        res.send(value);
      }
    } else {
      throw new Error('unexpected');
    }
  });
  done();
}
