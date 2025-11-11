import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { SwaggerResponse } from '@utils/classes';

export class JobResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  jobType: string;

  @ApiProperty()
  queueName: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  attempts: number;

  @ApiProperty({ required: false })
  result?: any;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ required: false })
  startedAt?: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;

  @ApiProperty({ required: false })
  failedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class JobsListResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  jobs: JobResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  page: number;
}

export class JobStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  waiting: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  delayed: number;
}

export class GetJobsSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Jobs retrieved successfully',
  JobsListResponseDto,
) {}

export class GetJobStatusSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Job status retrieved successfully',
  JobResponseDto,
) {}

export class GetJobStatsSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  'Job statistics retrieved successfully',
  JobStatsResponseDto,
) {}
