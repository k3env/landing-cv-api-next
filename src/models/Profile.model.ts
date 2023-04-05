import { ObjectId } from '@fastify/mongodb';

export interface Profile {
  name: string;
  profilePhoto: string | ObjectId;
  about_photo: string | ObjectId;
  about_header: string;
  about_summary: string;
  degree: 'Intern' | 'Junior' | 'Middle' | 'Senior' | 'Lead';
  birth: Date;
  experience: string;
  phone: string;
  email: string;
  address: string;
  isFreelance: boolean;
  lookForJob: 'active' | 'passive' | 'not-interested';
}
