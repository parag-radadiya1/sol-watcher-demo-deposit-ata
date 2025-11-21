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
