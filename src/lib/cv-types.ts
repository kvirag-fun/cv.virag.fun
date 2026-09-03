// Shared CV type definitions — type-only, safe to import from client code.

export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  period: string;
  current?: boolean;
  summary?: string;
  bullets: string[];
}

export interface Skill {
  name: string;
  level: string;
  score: number; // 0–100, drives the animated bar
}

export interface Language {
  name: string;
  level: string;
}

export interface EducationItem {
  school: string;
  field: string;
  period: string;
  location: string;
  note?: string;
}

export interface CvData {
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  linkedin?: string;
  birthDate: string;
  about: string[];
  experience: ExperienceItem[];
  skills: Skill[];
  languages: Language[];
  education: EducationItem[];
  interests: string;
  interestTags: string[];
  drivingLicense: string;
}
