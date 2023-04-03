import { ObjectId } from '@fastify/mongodb';
import { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest, FastifyTypeProviderDefault } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { jwtVerify, KeyLike } from 'jose';
import { Profile } from '../models/Profile.model';

export function ProfileController(
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
  const collection = app.mongo.db?.collection<Profile>('profile');
  const { pubKey, assetPath } = opts;
  if (collection) {
    app.get('/', async function (req: FastifyRequest, res: FastifyReply) {
      const { query } = req;
      if ((query as { aggregated: boolean }).aggregated) {
        const profile = await collection
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
          p.about_photo.url = `${assetPath.href}/${p.about_photo._id}.${p.about_photo.extension}`;
          p.profilePhoto.url = `${assetPath.href}/${p.profilePhoto._id}.${p.profilePhoto.extension}`;
          res.send({ data: p });
        } else {
          res.status(404).send({ error: 'No profile found' });
        }
      } else {
        res.send({ data: await collection?.findOne() });
      }
    });
    app.post('/', async (req: FastifyRequest, res: FastifyReply) => {
      const { token } = req.cookies;
      if (!token) {
        res.status(401).send({ message: 'Unauthorized' });
        return;
      }
      try {
        await jwtVerify(token, pubKey);
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
      } catch (e) {
        const err = e as Error;
        console.log(err);
        res.status(500).send({ err });
      }
    });
    done();
  } else {
    done(new Error('unexpected'));
  }
}
