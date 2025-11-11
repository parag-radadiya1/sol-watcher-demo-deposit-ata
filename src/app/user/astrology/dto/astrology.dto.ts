import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HttpStatus } from '@nestjs/common';
import { IAstrologyNumerologyReading } from '../interfaces/astrology-reading.interface';

export class CheckAstrologyDto {
  @ApiProperty({
    example: 'What does my birth chart say about my career?',
    description: 'Optional specific question about astrology',
    required: false
  })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({
    example: false,
    description: 'Force regenerate reading even if cached version exists',
    required: false,
    default: false
  })
  @IsOptional()
  forceRegenerate?: boolean;
}

export interface IAstrologyResponse {
  reading: IAstrologyNumerologyReading;
  userDetails: {
    fullName: string;
    birthDate: string;
    birthPlace: string;
  };
  cached: boolean;
  generatedAt: Date;
}

export class AstrologySuccessResponse {
  @ApiProperty({ example: HttpStatus.OK })
  statusCode: HttpStatus;

  @ApiProperty({ example: 'Astrology reading generated successfully' })
  message: string;

  @ApiProperty({
    type: Object,
    description: 'Complete astrology and numerology reading with user details'
  })
  data: IAstrologyResponse;
}
