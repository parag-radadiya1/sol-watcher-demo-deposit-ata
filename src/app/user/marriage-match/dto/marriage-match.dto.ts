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
  @ValidateNested()
  @Type(() => Object)
  partners: {
    boy: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
    girl: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
  };

  @ApiProperty({ description: 'Synastry analysis' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  synastry: {
    overallSummary: string;
    aspects: Array<{
      planet1: string;
      planet2: string;
      aspect: string;
      orb: number;
      interpretation: string;
    }>;
    compatibilityFactors: {
      emotional: string;
      intellectual: string;
      physical: string;
      spiritual: string;
    };
  };

  @ApiProperty({ description: 'Composite chart analysis' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  compositeChart: {
    sun: {
      sign: string;
      house: number;
      interpretation: string;
    };
    moon: {
      sign: string;
      house: number;
      interpretation: string;
    };
    ascendant: {
      sign: string;
      interpretation: string;
    };
    venus: {
      sign: string;
      house: number;
      interpretation: string;
    };
    mars: {
      sign: string;
      house: number;
      interpretation: string;
    };
    relationshipThemes: {
      strengths: string[];
      challenges: string[];
    };
  };

  @ApiProperty({ description: 'Compatibility scores' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  scores: {
    love: number;
    emotion: number;
    communication: number;
    sexuality: number;
    overall: number;
  };

  @ApiProperty({ description: 'Final summary' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
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
  @ValidateNested()
  @Type(() => Object)
  partners?: {
    boy: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
    girl: {
      name: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      gender: string;
    };
  };

  @ApiProperty({ description: 'Synastry analysis', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  synastry?: {
    overallSummary: string;
    aspects: Array<{
      planet1: string;
      planet2: string;
      aspect: string;
      orb: number;
      interpretation: string;
    }>;
    compatibilityFactors: {
      emotional: string;
      intellectual: string;
      physical: string;
      spiritual: string;
    };
  };

  @ApiProperty({ description: 'Composite chart analysis', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  compositeChart?: {
    sun: {
      sign: string;
      house: number;
      interpretation: string;
    };
    moon: {
      sign: string;
      house: number;
      interpretation: string;
    };
    ascendant: {
      sign: string;
      interpretation: string;
    };
    venus: {
      sign: string;
      house: number;
      interpretation: string;
    };
    mars: {
      sign: string;
      house: number;
      interpretation: string;
    };
    relationshipThemes: {
      strengths: string[];
      challenges: string[];
    };
  };

  @ApiProperty({ description: 'Compatibility scores', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  scores?: {
    love: number;
    emotion: number;
    communication: number;
    sexuality: number;
    overall: number;
  };

  @ApiProperty({ description: 'Final summary', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
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
