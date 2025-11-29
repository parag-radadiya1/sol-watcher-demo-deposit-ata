import { ApiProperty } from '@nestjs/swagger';
import { ChoghadiyaNature, ChoghadiyaType } from '../constants/choghadiya.constant';


export class ChoghadiyaPeriodDto {
  @ApiProperty({
    description: 'Index of the Choghadiya period (1-8)',
    example: 1,
  })
  index: number;

  @ApiProperty({
    description: 'Name of the Choghadiya',
    example: 'Amrit',
    enum: ChoghadiyaType,
  })
  name: ChoghadiyaType;

  @ApiProperty({
    description: 'Nature of the Choghadiya',
    example: 'Auspicious',
    enum: ChoghadiyaNature,
  })
  nature: ChoghadiyaNature;

  @ApiProperty({
    description: 'Meaning of the Choghadiya',
    example: 'Nectar - Most auspicious',
  })
  meaning: string;

  @ApiProperty({
    description: 'Description of the Choghadiya',
    example: 'Best time for all auspicious activities',
  })
  description: string;

  @ApiProperty({
    description: 'Start time in ISO format',
    example: '2025-11-28T06:55:00.000Z',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in ISO format',
    example: '2025-11-28T08:25:00.000Z',
  })
  endTime: string;

  @ApiProperty({
    description: 'Formatted start time (HH:MM AM/PM)',
    example: '06:55 AM',
  })
  startTimeFormatted: string;

  @ApiProperty({
    description: 'Formatted end time (HH:MM AM/PM)',
    example: '08:25 AM',
  })
  endTimeFormatted: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 90,
  })
  durationMinutes: number;

  @ApiProperty({
    description: 'True if this period is Rahu Kalam',
    example: false,
    required: false,
  })
  isRahuKalam?: boolean;

  @ApiProperty({
    description: 'True if this period is Yamaganda',
    example: false,
    required: false,
  })
  isYamaganda?: boolean;

  @ApiProperty({
    description: 'True if this period is Gulika',
    example: false,
    required: false,
  })
  isGulika?: boolean;

  @ApiProperty({
    description: 'True if this period is Vaar Vela (day only)',
    example: false,
    required: false,
  })
  isVaarVela?: boolean;

  @ApiProperty({
    description: 'True if this period is Kaal Vela (night only)',
    example: false,
    required: false,
  })
  isKaalVela?: boolean;

  @ApiProperty({
    description: 'True if this period is Kaal Ratri (night 8th segment)',
    example: false,
    required: false,
  })
  isKaalRatri?: boolean;
}

export class ChoghadiyaDataDto {
  @ApiProperty({
    description: 'Date for which Choghadiya is calculated',
    example: '2025-11-28',
  })
  date: string;

  @ApiProperty({
    description: 'Latitude of the location',
    example: 21.2336,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude of the location',
    example: 72.8625,
  })
  longitude: number;

  @ApiProperty({
    description: 'Sunrise time in ISO format',
    example: '2025-11-28T06:55:00.000Z',
  })
  sunrise: string;

  @ApiProperty({
    description: 'Sunset time in ISO format',
    example: '2025-11-28T17:56:00.000Z',
  })
  sunset: string;

  @ApiProperty({
    description: 'Formatted sunrise time',
    example: '06:55 AM',
  })
  sunriseFormatted: string;

  @ApiProperty({
    description: 'Formatted sunset time',
    example: '05:56 PM',
  })
  sunsetFormatted: string;

  @ApiProperty({
    description: 'Day of the week',
    example: 'Thursday',
  })
  dayOfWeek: string;

  @ApiProperty({
    description: 'Array of day Choghadiya periods',
    type: [ChoghadiyaPeriodDto],
  })
  dayChoghadiya: ChoghadiyaPeriodDto[];

  @ApiProperty({
    description: 'Array of night Choghadiya periods',
    type: [ChoghadiyaPeriodDto],
  })
  nightChoghadiya: ChoghadiyaPeriodDto[];
}

export class ChoghadiyaResponseDto {
  @ApiProperty({
    description: 'Choghadiya data',
    type: ChoghadiyaDataDto,
  })
  choghadiya: ChoghadiyaDataDto;
}

export class ChoghadiyaSuccessResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Success message',
    example: 'Choghadiya data retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: ChoghadiyaResponseDto,
  })
  data: ChoghadiyaResponseDto;
}

