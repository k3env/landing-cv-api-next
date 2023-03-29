import { ObjectId } from '@fastify/mongodb';

export interface Project {
  title: string;
  cover: string | ObjectId;
  images: string[] | ObjectId[];
  description: string;
  tags: string[] | ObjectId[];
}
