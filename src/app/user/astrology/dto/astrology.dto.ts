import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
