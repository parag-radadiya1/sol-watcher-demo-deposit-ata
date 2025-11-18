import { ApiProperty, PickType, IntersectionType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDate,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Create Marriage Match DTO with new structure
export class CreateMarriageMatchDto {
  @ApiProperty({ description: 'Partners information' })
  @IsNotEmpty()
  partners: {
    boy: any;
    girl: any;
  };

  @ApiProperty({ description: 'Synastry analysis' })
  @IsNotEmpty()
  synastry: {
    overallSummary: string;
    aspects: any[];
    compatibilityFactors: any;
  };

  @ApiProperty({ description: 'Composite chart analysis' })
  @IsNotEmpty()
  compositeChart: {
    sun: any;
    moon: any;
    ascendant: any;
    venus: any;
    mars: any;
    relationshipThemes: {
      strengths: string[];
      challenges: string[];
    };
  };

  @ApiProperty({ description: 'Compatibility scores' })
  @IsNotEmpty()
  scores: {
    love: number;
    emotion: number;
    communication: number;
    sexuality: number;
    overall: number;
  };

  @ApiProperty({ description: 'Final summary' })
  @IsNotEmpty()
  finalSummary: {
    short: string;
    detailed: string;
  };

  @ApiProperty({ example: 'ai_generated', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
  @IsString()
  @IsOptional()
  partnerId?: string;
}

// Update Marriage Match DTO
export class UpdateMarriageMatchDto {
  @ApiProperty({ description: 'Partners information', required: false })
  @IsOptional()
  partners?: {
    boy: any;
    girl: any;
  };

  @ApiProperty({ description: 'Synastry analysis', required: false })
  @IsOptional()
  synastry?: {
    overallSummary: string;
    aspects: any[];
    compatibilityFactors: any;
  };

  @ApiProperty({ description: 'Composite chart analysis', required: false })
  @IsOptional()
  compositeChart?: {
    sun: any;
    moon: any;
    ascendant: any;
    venus: any;
    mars: any;
    relationshipThemes: {
      strengths: string[];
      challenges: string[];
    };
  };

  @ApiProperty({ description: 'Compatibility scores', required: false })
  @IsOptional()
  scores?: {
    love: number;
    emotion: number;
    communication: number;
    sexuality: number;
    overall: number;
  };

  @ApiProperty({ description: 'Final summary', required: false })
  @IsOptional()
  finalSummary?: {
    short: string;
    detailed: string;
  };

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Query DTO for getting matches
export class GetMarriageMatchesQueryDto {
  @ApiProperty({ example: 50, required: false, description: 'Maximum number of matches to return' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    example: 'recent',
    required: false,
    enum: ['recent', 'compatibility', 'best'],
    description: 'Sort order: recent (newest first), compatibility (highest first), best (overall best)',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'recent' | 'compatibility' | 'best';

  @ApiProperty({
    example: 60,
    required: false,
    description: 'Minimum overall compatibility score (0-100)',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minCompatibility?: number;
}
