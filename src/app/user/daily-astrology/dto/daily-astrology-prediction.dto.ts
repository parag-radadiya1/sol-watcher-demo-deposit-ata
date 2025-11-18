import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, Matches } from 'class-validator';

/**
 * DTO for requesting daily astrology predictions for a date range
 */
export class GetDailyAstrologyPredictionDto {
  @ApiProperty({
    example: '2024-11-20',
    description: 'Start date for prediction range (YYYY-MM-DD format)',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2024-11-23',
    description: 'End date for prediction range (YYYY-MM-DD format). Max 7 days from start date.',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    example: false,
    description: 'Force regenerate predictions even if they exist in DB',
    required: false,
    default: false,
  })
  @IsOptional()
  forceRegenerate?: boolean;
}

/**
 * Response DTO for a single day prediction
 */
export class DailyPredictionResponseDto {
  @ApiProperty({ example: '2024-11-20' })
  date: string;

  @ApiProperty({ example: 'wednesday' })
  dayOfWeek: string;

  @ApiProperty({ example: true })
  fromCache: boolean;

  @ApiProperty({ example: '2024-11-20T10:30:00.000Z', type: 'string' })
  generatedAt?: string | Date;

  @ApiProperty({ example: 'Wednesday brings a steady and grounding energy...' })
  overallTheme: string;

  @ApiProperty({ type: Object })
  astrologicalInfluence: any;

  @ApiProperty({ type: Object })
  numerologyInfluence: any;

  @ApiProperty({ type: Object, required: false })
  careerAndWork?: any;

  @ApiProperty({ type: Object, required: false })
  moneyAndFinance?: any;

  @ApiProperty({ type: Object, required: false })
  loveAndRelationships?: any;

  @ApiProperty({ type: Object, required: false })
  emotionalAndMentalHealth?: any;

  @ApiProperty({ type: Object, required: false })
  physicalHealthAndWellness?: any;

  @ApiProperty({ type: Object, required: false })
  familyAndSocialLife?: any;

  @ApiProperty({ type: Object, required: false })
  luckyElements?: any;

  @ApiProperty({ type: Object, required: false })
  aiActionPlan?: any;

  @ApiProperty({ example: 1 })
  schemaVersion: number;
}

/**
 * Response DTO for the complete date range predictions
 */
export class DailyAstrologyPredictionsResponseDto {
  @ApiProperty({ example: 7, description: 'Total predictions generated/retrieved' })
  totalDays: number;

  @ApiProperty({ example: 3, description: 'Number of predictions from database cache' })
  fromCacheCount: number;

  @ApiProperty({ example: 4, description: 'Number of predictions newly generated' })
  newGeneratedCount: number;

  @ApiProperty({
    type: [DailyPredictionResponseDto],
    description: 'Array of daily predictions',
  })
  predictions: DailyPredictionResponseDto[];

  @ApiProperty({
    example: '2024-11-20',
    description: 'Start date of the range',
  })
  dateRange: {
    start: string;
    end: string;
  };

  @ApiProperty({
    example: '2024-11-20T15:30:00.000Z',
    description: 'When the predictions were generated',
  })
  generatedAt: Date;
}

/**
 * Error response for validation failures
 */
export class DailyPredictionErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: 'Date range exceeds maximum of 7 days',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({
    type: Object,
    example: {
      startDate: 'must be a valid date',
      endDate: 'cannot be more than 10 days in the future',
    },
    required: false,
    description: 'Field validation errors',
  })
  errors?: Record<string, string>;
}
