import { ApiProperty } from '@nestjs/swagger';

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
