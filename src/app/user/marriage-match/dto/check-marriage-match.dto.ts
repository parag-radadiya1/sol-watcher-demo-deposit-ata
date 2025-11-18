import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Simplified DTO for checking marriage compatibility
 * Only requires partner's basic birth details
 * Current user details are fetched from auth token
 */
export class CheckMarriageMatchDto {
  @ApiProperty({ example: 'Priya Singh', description: 'Partner name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2001-08-20', description: 'Partner birth date' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  birthDate: Date;

  @ApiProperty({ example: '10:30', description: 'Partner birth time (HH:MM format)' })
  @IsString()
  @IsNotEmpty()
  birthTime: string;

  @ApiProperty({ example: 'Delhi, India', description: 'Partner birth place' })
  @IsString()
  @IsNotEmpty()
  birthPlace: string;
}

/**
 * Response DTO for marriage match - New structure
 */
export class MarriageMatchResponseDto {
  statusCode: number;
  message: string;
  data: {
    matchId: string;
    partners: {
      boy: any;
      girl: any;
    };
    synastry: {
      overallSummary: string;
      aspects: any[];
      compatibilityFactors: any;
    };
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
    scores: {
      love: number;
      emotion: number;
      communication: number;
      sexuality: number;
      overall: number;
    };
    finalSummary: {
      short: string;
      detailed: string;
    };
    createdAt: Date;
    cached?: boolean;
    cacheSource?: string;
  };
}
