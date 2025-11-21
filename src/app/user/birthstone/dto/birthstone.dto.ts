import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

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
