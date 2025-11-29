import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class GetChoghadiyaDto {
  @ApiProperty({
    description: 'Date for which to get Choghadiya (YYYY-MM-DD format). Defaults to current date.',
    example: '2025-11-28',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Latitude of the location',
    example: 21.2336,
    required: true,
  })
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Longitude of the location',
    example: 72.8625,
    required: true,
  })
  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @ApiProperty({
    description: 'Timezone identifier (e.g., Asia/Kolkata). Optional.',
    example: 'Asia/Kolkata',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
