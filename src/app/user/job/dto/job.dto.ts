import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { CommonSearchDto } from '@utils/dto';

export class GetJobsQueryDto extends CommonSearchDto{
  @ApiProperty({ required: false, description: 'Filter by job type' })
  @IsOptional()
  @IsString()
  jobType?: string;

  @ApiProperty({ required: false, description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class GetJobStatusDto {
  @ApiProperty({ required: true, description: 'Job ID' })
  @IsString()
  jobId: string;
}
