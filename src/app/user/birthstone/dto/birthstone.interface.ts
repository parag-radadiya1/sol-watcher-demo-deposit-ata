import { IBirthstoneReading } from '../interfaces';

export interface IBirthstoneOverview {
  birthMonth: string;
  birthSign: string;
  lifePathNumber: number;
  summary: string;
  keyThemes: string[];
}

export interface IBirthstoneCategories {
  modernBirthstone: string;
  traditional: string;
  ayurvedicBirthstone: string;
  mysticalBirthstone: string;
  luckyCharm: string;
  zodiacStarStone: string;
  birthdayStone: string;
}

export interface IBirthstoneHowToWear {
  day: string;
  metal: string;
  finger: string;
  recommendedWeight: string;
  additionalInstructions: string;
}

export interface IBirthstoneResponse {
  reading?: IBirthstoneReading;
  markdown?: string;
  userDetails?: {
    fullName: string;
    birthDate: string;
    birthPlace: string;
  };
  cached?: boolean;
  generatedAt?: Date;
  jobId?: string;
  status?: string;
  message?: string;
  result?: IBirthstoneReading;
}

export interface IBirthstoneMarkdownResponse {
  markdown?: string;
  userDetails?: {
    fullName: string;
    birthDate: string;
    birthPlace: string;
  };
  cached?: boolean;
  generatedAt?: Date;
  jobId?: string;
  status?: string;
  message?: string;
}

export interface IBirthstoneOverviewResponse {
  overview?: IBirthstoneOverview;
  birthstoneCategories?: IBirthstoneCategories;
  meaningSymbolism?: string;
  keyBenefits?: string[];
  howToWear?: IBirthstoneHowToWear;
  generatedAt?: Date;
  birthMonth?: string;
  hasReading?: boolean;
  suggestion?: string;
}
