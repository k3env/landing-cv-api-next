import { MultipartFile } from '@fastify/multipart';
import { FastifyInstance, FastifyBaseLogger, FastifyTypeProviderDefault, FastifyRequest, FastifyReply } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { File } from '../models/File.model';
import { createWriteStream, rmSync } from 'fs';
import { ObjectId } from '@fastify/mongodb';
import { jwtVerify, KeyLike } from 'jose';

export function FilesController(
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
  const collection = app.mongo.db?.collection<File>('files');
  const { pubKey, assetPath } = opts;
  if (collection) {
    app.get('/', async function (req: FastifyRequest, res: FastifyReply) {
      const files = await collection.find().toArray();
      res.send({ data: files?.map((d) => ({ ...d, url: `${assetPath.href}/${d._id}.${d.extension}` })) });
    });
    app.get('/:id', async function (req: FastifyRequest, res: FastifyReply) {
      const file = await collection.findOne({ _id: new ObjectId((req.params as { id: string }).id) });
      if (file) {
        res.send({ data: { ...file, url: `${assetPath.href}/${file._id}.${file.extension}` } });
      } else {
        res.status(404).send({ error: 'File not found' });
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
        const reqBody = await req.file();

        if (reqBody) {
          const { fields } = reqBody;
          const f = fields['file'] as MultipartFile;
          if (f && f.type === 'file') {
            const record: File = {
              name: f.filename,
              encoding: f.encoding,
              extension: f.filename.split('.').slice(-1)[0],
              mime: f.mimetype,
            };
            const r = await app.mongo.db?.collection<File>('files').insertOne(record);
            const ws = createWriteStream(process.cwd() + '/public/' + r?.insertedId + '.' + record.extension);
            const fb = await f.toBuffer();
            ws.write(fb);
            ws.close();
            res.send({ data: r });
          }
        }
      } catch (e) {
        res.status(401).send({ ...e });
      }
    });
    app.delete('/:id', async (req: FastifyRequest, res: FastifyReply) => {
      const { token } = req.cookies;
      if (!token) {
        res.status(401).send({ message: 'Unauthorized' });
        return;
      }
      try {
        await jwtVerify(token, pubKey);
        const file = await collection.findOneAndDelete({ _id: new ObjectId((req.params as { id: string }).id) });
        if (file && file.value) {
          rmSync(process.cwd() + '/public/' + file.value._id.toHexString() + '.' + file.value.extension);
          res.status(204).send();
        } else {
          res.status(404).send({ error: 'File not found' });
        }
      } catch (e) {
        res.status(401).send({ ...e });
      }
    });
  }
  done();
}
