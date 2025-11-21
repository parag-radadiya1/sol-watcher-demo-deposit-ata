// Interfaces for daily astrology module

/**
 * Response DTO for a single day prediction
 */
export class DailyPredictionResponseDto {
  date: string;
  dayOfWeek: string;
  fromCache: boolean;
  generatedAt?: string | Date;
  overallTheme: string;
  astrologicalInfluence: any;
  numerologyInfluence: any;
  careerAndWork?: any;
  moneyAndFinance?: any;
  loveAndRelationships?: any;
  emotionalAndMentalHealth?: any;
  physicalHealthAndWellness?: any;
  familyAndSocialLife?: any;
  luckyElements?: any;
  aiActionPlan?: any;
  schemaVersion: number;
}

/**
 * Response DTO for the complete date range predictions
 */
export class DailyAstrologyPredictionsResponseDto {
  totalDays: number;
  fromCacheCount: number;
  newGeneratedCount: number;
  predictions: DailyPredictionResponseDto[];
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: Date;
}
