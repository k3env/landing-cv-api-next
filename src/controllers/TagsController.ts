import { ObjectId } from '@fastify/mongodb';
import { FastifyInstance, FastifyBaseLogger, FastifyTypeProviderDefault } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Tag } from '../models/Tag.model';

export function TagsController(
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
    const tags = await app.mongo.db?.collection<Tag>('tags').find().toArray();
    res.send({ data: tags });
  });
  app.post('/', async (req, res) => {
    const collection = app.mongo.db?.collection<Tag>('tags');
    if (collection) {
      const update = req.body as Tag;
      const value = await collection.insertOne(update);
      res.send(value);
    } else {
      throw new Error('unexpected');
    }
  });
  app.delete('/:id', async (req, res) => {
    const collection = app.mongo.db?.collection<Tag>('tags');
    if (collection) {
      const tag = await collection.findOneAndDelete({ _id: new ObjectId((req.params as { id: string }).id) });
      res.send(tag);
    } else {
      throw new Error('unexpected');
    }
  });
  done();
}
