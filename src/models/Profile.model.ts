export interface Profile {
  name: string;
  profilePhoto: string;
  about_photo: string;
  about_header: string;
  about_summary: string;
  degree: 'Intern' | 'Junior' | 'Middle' | 'Senior' | 'Lead';
  birth: Date;
  experience: string;
  phone: string;
  email: string;
  address: string;
  isFreelance: boolean;
}
