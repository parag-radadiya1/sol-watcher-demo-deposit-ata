import { Controller, Get, Query, Req, UseGuards, HttpCode, HttpStatus, Post, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JobService } from './job.service';
import { AuthGuard } from '@guard/auth.guard';
import { IAuthGuardResponse, ICommonResponse, BadRequestResponse, InternalServerErrorResponse } from '@utils/dto';
import { commonResponse } from '@utils/constant';
import {
  GetJobsQueryDto,
  GetJobStatusDto,
  GetJobsSuccessResponse,
  GetJobStatusSuccessResponse,
  GetJobStatsSuccessResponse,
  JobsListResponseDto,
  JobResponseDto,
  JobStatsResponseDto,
} from './dto';

@Controller('user/job')
@ApiTags('User-Job')
// @UseGuards(AuthGuard)
// @ApiBearerAuth()
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.badRequest,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internalServerError,
})
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all jobs for the authenticated user' })
  @ApiOkResponse({
    description: 'Jobs retrieved successfully',
    type: GetJobsSuccessResponse,
  })
  async getMyJobs(
    @Req() req: IAuthGuardResponse,
    @Query() query: GetJobsQueryDto,
  ): Promise<ICommonResponse<JobsListResponseDto>> {
    console.log('=== query ====', query);
    return this.jobService.getMyJobs(req, query);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific job status by jobId' })
  @ApiOkResponse({
    description: 'Job status retrieved successfully',
    type: GetJobStatusSuccessResponse,
  })
  async getJobStatus(
    @Req() req: IAuthGuardResponse,
    @Query() query: GetJobStatusDto,
  ): Promise<ICommonResponse<JobResponseDto>> {
    return this.jobService.getJobStatus(req, query.jobId);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get job statistics for the authenticated user' })
  @ApiOkResponse({
    description: 'Job statistics retrieved successfully',
    type: GetJobStatsSuccessResponse,
  })
  async getJobStats(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<JobStatsResponseDto>> {
    return this.jobService.getJobStats(req);
  }

  @Get('latest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get latest job by type' })
  @ApiOkResponse({
    description: 'Latest job retrieved successfully',
    type: GetJobStatusSuccessResponse,
  })
  async getLatestJob(
    @Req() req: IAuthGuardResponse,
    @Query('jobType') jobType: string,
  ): Promise<ICommonResponse<JobResponseDto>> {
    return this.jobService.getLatestJob(req, jobType);
  }

  @Get('my-latest-astrology-job')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user\'s latest astrology job from their profile',
    description: 'Retrieves the latest astrology job stored in user profile (lastAstrologyJobId field)'
  })
  @ApiOkResponse({
    description: 'Latest astrology job retrieved successfully',
    type: GetJobStatusSuccessResponse,
  })
  @ApiNotFoundResponse({
    description: 'No astrology job found for this user',
  })
  async getMyLatestAstrologyJob(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<JobResponseDto>> {
    return this.jobService.getMyLatestAstrologyJob(req);
  }

  @Post('retry/:jobId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retry/recall a failed job',
    description: 'Re-queues a failed job with the same data. Only failed jobs can be retried.'
  })
  @ApiCreatedResponse({
    description: 'Job retry initiated successfully',
    type: GetJobStatusSuccessResponse,
  })
  @ApiNotFoundResponse({
    description: 'Job not found',
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized to retry this job',
  })
  @ApiBadRequestResponse({
    description: 'Only failed jobs can be retried',
  })
  async retryJob(
    @Req() req: IAuthGuardResponse,
    @Param('jobId') jobId: string,
  ): Promise<ICommonResponse<JobResponseDto>> {
    return this.jobService.retryJob(req, jobId);
  }
}
