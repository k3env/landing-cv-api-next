import { ObjectId } from '@fastify/mongodb';
import { FastifyInstance, FastifyBaseLogger, FastifyTypeProviderDefault } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { KeyLike, jwtVerify } from 'jose';
import { Tag } from '../models/Tag.model';

export function TagsController(
  app: FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    FastifyBaseLogger,
    FastifyTypeProviderDefault
  >,
  opts: { pubKey: KeyLike; assetPath: URL },
  done: (err?: Error) => void,
): void {
  const collection = app.mongo.db?.collection<Tag>('tags');
  const { pubKey } = opts;
  if (collection) {
    app.get('/', async (req, res) => {
      const tags = await collection.find().toArray();
      res.send({ data: tags });
    });
    app.post('/', async (req, res) => {
      const { token } = req.cookies;
      if (!token) {
        res.status(401).send({ message: 'Unauthorized' });
        return;
      }
      try {
        await jwtVerify(token, pubKey);
        const update = req.body as Tag;
        const value = await collection.insertOne(update);
        res.send(value);
      } catch (e) {
        res.status(401).send({ ...e });
      }
    });
    app.delete('/:id', async (req, res) => {
      const { token } = req.cookies;
      if (!token) {
        res.status(401).send({ message: 'Unauthorized' });
        return;
      }
      try {
        await jwtVerify(token, pubKey);
        const tag = await collection.findOneAndDelete({ _id: new ObjectId((req.params as { id: string }).id) });
        res.send(tag);
      } catch (e) {
        res.status(401).send({ ...e });
      }
    });
  } else {
    throw new Error('Cant init collection in mongo');
  }
  done();
}
