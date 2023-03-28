import { ObjectId } from '@fastify/mongodb';
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
    const { query } = req;
    if ((query as { aggregated: boolean }).aggregated) {
      const profile = await app.mongo.db
        ?.collection<Profile>('profile')
        .aggregate([
          {
            $lookup: {
              from: 'files',
              localField: 'about_photo',
              foreignField: '_id',
              as: 'about_photo',
            },
          },
          {
            $lookup: {
              from: 'files',
              localField: 'profilePhoto',
              foreignField: '_id',
              as: 'profilePhoto',
            },
          },
          {
            $unwind: {
              path: '$about_photo',
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $unwind: {
              path: '$profilePhoto',
              preserveNullAndEmptyArrays: false,
            },
          },
        ])
        .toArray();
      if (profile && profile[0]) {
        const p = profile[0];
        p.about_photo.url = `${process.env.PUBLIC_BASE_URL}/${p.about_photo._id}.${p.about_photo.extension}`;
        p.profilePhoto.url = `${process.env.PUBLIC_BASE_URL}/${p.profilePhoto._id}.${p.profilePhoto.extension}`;
        res.send({ data: p });
      } else {
        res.status(404).send({ error: 'No profile found' });
      }
    } else {
      const p = await app.mongo.db?.collection<Profile>('profile').findOne();
      res.send({ data: p });
    }
  });
  app.post('/', async (req: FastifyRequest, res: FastifyReply) => {
    const collection = app.mongo.db?.collection<Profile>('profile');
    if (collection) {
      const profile = await collection.findOne();
      const update = req.body as Profile;
      update.about_photo = new ObjectId(update.about_photo);
      update.profilePhoto = new ObjectId(update.profilePhoto);
      if (profile === null) {
        const value = await collection.insertOne(update as Profile);
        res.send(value);
      } else {
        const value = await collection.replaceOne({ _id: profile._id }, { ...profile, ...update });
        res.send(value);
      }
    } else {
      throw new Error('unexpected');
    }
  });
  done();
}
