import { FastifyInstance, FastifyBaseLogger, FastifyTypeProviderDefault } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { ObjectId, OptionalId, WithId } from 'mongodb';
import { File } from '../models/File.model';
import { Project } from '../models/Project.model';

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
  const collection = app.mongo.db?.collection<Project>('projects');
  if (collection) {
    app.get('/', async (req, res) => {
      const query = req.query as Record<string, string | undefined>;
      if (query.aggregated !== undefined) {
        const data = await collection
          .aggregate([
            {
              $lookup: {
                from: 'files',
                localField: 'cover',
                foreignField: '_id',
                as: 'cover',
              },
            },
            {
              $unwind: {
                path: '$cover',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'files',
                localField: 'images',
                foreignField: '_id',
                as: 'images',
              },
            },
            {
              $lookup: {
                from: 'tags',
                localField: 'tags',
                foreignField: '_id',
                as: 'tags',
              },
            },
          ])
          .toArray();
        data.forEach((doc) => {
          doc.cover.url = `${process.env.PUBLIC_BASE_URL}/${doc.cover._id}.${doc.cover.extension}`;
          doc.images = doc.images.map((i: WithId<File>) => ({
            ...i,
            url: `${process.env.PUBLIC_BASE_URL}/${i._id}.${i.extension}`,
          }));
        });
        res.send({ data: data });
      } else {
        const data = await collection.find().toArray();
        res.send({ data: data });
      }
    });
    app.post('/', async (req, res) => {
      const value = req.body as OptionalId<Project>;
      value.cover = new ObjectId(value.cover);
      value.images = value.images.map((v) => new ObjectId(v));
      value.tags = value.tags.map((v) => new ObjectId(v));
      if (value._id !== undefined) {
        const id = new ObjectId(value._id);
        delete value._id;
        const result = await collection.findOneAndReplace({ _id: id }, value);
        res.send({ data: result });
      } else {
        const result = await collection.insertOne(value);
        res.send({ data: result });
      }
    });
    app.get('/:id', async (req, res) => {
      const data = await collection.findOne({ _id: new ObjectId((req.params as { id: string }).id) });
      res.send({ data });
    });
    app.delete('/:id', async (req, res) => {
      const data = await collection.findOneAndDelete({ _id: new ObjectId((req.params as { id: string }).id) });
      res.send({ data });
    });
  } else {
    throw new Error('Cant init collection in mongo');
  }
  done();
}
