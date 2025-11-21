import { IAstrologyNumerologyReading } from '../interfaces/astrology-reading.interface';

export interface IAstrologyReadingResponse {
  reading: IAstrologyNumerologyReading;
  userDetails: {
    fullName: string;
    birthDate: string;
    birthPlace: string;
  };
  cached: boolean;
  generatedAt: Date;
}

// Response when job is queued or in progress
export interface IAstrologyJobResponse {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  failedAt?: Date;
  userDetails: {
    fullName: string;
    birthDate: string;
    birthPlace: string;
  };
}

// Union type for all possible response formats
export type IAstrologyResponse = IAstrologyReadingResponse | IAstrologyJobResponse;
