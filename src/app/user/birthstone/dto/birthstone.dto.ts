import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { HttpStatus } from '@nestjs/common';
import { ICommonResponse } from '@utils/dto';
import { IBirthstoneReading } from '../interfaces';

export class CheckBirthstoneDto {
  @ApiProperty({
    description: 'Force regenerate reading even if cached version exists',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  forceRegenerate?: boolean;
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

export class BirthstoneSuccessResponse implements ICommonResponse<IBirthstoneResponse> {
  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ example: 'Birthstone reading retrieved successfully' })
  message: string;

  @ApiProperty({
    example: {
      reading: {
        overview: {
          birthMonth: 'January',
          birthSign: 'Capricorn',
          lifePathNumber: 5,
          summary: 'Your primary birthstone is Garnet...',
          keyThemes: ['Protection', 'Passion', 'Energy'],
        },
        primaryBirthstone: {
          name: 'Garnet',
          color: 'Deep Red',
          meaning: 'Passion and Protection',
          origin: 'India, Sri Lanka, Africa',
          properties: ['Grounding', 'Energizing', 'Protective'],
          chakraConnection: 'Root Chakra',
          element: 'Fire',
          vibration: 'High - Energetic and Passionate',
          description: 'Garnet is a powerful stone...',
        },
      },
      userDetails: {
        fullName: 'John Doe',
        birthDate: 'January 15, 1990',
        birthPlace: 'New York, USA',
      },
      cached: false,
      generatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  data: IBirthstoneResponse;
}
