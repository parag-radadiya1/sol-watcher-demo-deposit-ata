import { HttpStatus, Injectable } from '@nestjs/common';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import { JobModelService } from '../../../entities/job/job.service';
import {
  JobsListResponseDto,
  JobResponseDto,
  JobStatsResponseDto,
  GetJobsQueryDto,
} from './dto';
import { QueueService } from '@app/queue/queue.service';
import { UserModelService } from '@entities-user/user.service';

@Injectable()
export class JobService {
  constructor(
    private readonly jobModelService: JobModelService,
    private readonly queueService: QueueService,
    private readonly userModelService: UserModelService,
  ) {}

  /**
   * @description Get all jobs for the authenticated user with optional filters
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {GetJobsQueryDto} query - Query parameters for filtering and pagination
   * @returns {Promise<ICommonResponse<JobsListResponseDto>>} A promise that resolves to the jobs list
   */
  async getMyJobs(
    req: IAuthGuardResponse,
    query: GetJobsQueryDto,
  ): Promise<ICommonResponse<JobsListResponseDto>> {
    const userId = req.userId || 'sample user id';

    const { jobs, total } = await this.jobModelService.getUserJobs(userId, {
      jobType: query.jobType,
      status: query.status,
      limit: query?.limit || 20,
      page: query?.page || 0,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Jobs retrieved successfully',
      data: {
        jobs: jobs as any,
        total,
        limit: query.limit || 20,
        page: query.page || 0,
      },
    };
  }

  /**
   * @description Get specific job status by jobId
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {string} jobId - The job ID to retrieve
   * @returns {Promise<ICommonResponse<JobResponseDto>>} A promise that resolves to the job details
   */
  async getJobStatus(
    req: IAuthGuardResponse,
    jobId: string,
  ): Promise<ICommonResponse<JobResponseDto>> {
    const job = await this.jobModelService.getJobByJobId(jobId);

    if (!job) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Job not found',
        data: null,
      };
    }

    // Verify the job belongs to the user
    if (job.userId.toString() !== req.userId) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Unauthorized to access this job',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Job status retrieved successfully',
      data: job as any,
    };
  }

  /**
   * @description Get job statistics for the authenticated user
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @returns {Promise<ICommonResponse<JobStatsResponseDto>>} A promise that resolves to the job statistics
   */
  async getJobStats(
    req: IAuthGuardResponse,
  ): Promise<ICommonResponse<JobStatsResponseDto>> {
    const userId = req.userId;
    const stats = await this.jobModelService.getUserJobStats(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Job statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * @description Get latest job by type for the authenticated user
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {string} jobType - The type of job to retrieve
   * @returns {Promise<ICommonResponse<JobResponseDto>>} A promise that resolves to the latest job
   */
  async getLatestJob(
    req: IAuthGuardResponse,
    jobType: string,
  ): Promise<ICommonResponse<JobResponseDto>> {
    const userId = req.userId;
    const job = await this.jobModelService.getLatestJobByType(userId, jobType);

    return {
      statusCode: HttpStatus.OK,
      message: job ? 'Latest job retrieved successfully' : 'No job found',
      data: job as any,
    };
  }

  /**
   * @description Get user's latest astrology job from their profile
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @returns {Promise<ICommonResponse<JobResponseDto>>} A promise that resolves to the latest astrology job
   */
  async getMyLatestAstrologyJob(
    req: IAuthGuardResponse,
  ): Promise<ICommonResponse<JobResponseDto>> {
    const userId = req.userId;

    // Get user to find their lastAstrologyJobId
    const user = await this.userModelService.getUserById(userId);

    if (!user || !user.lastAstrologyJobId) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No astrology job found for this user',
        data: null,
      };
    }

    // Get the job details
    const job = await this.jobModelService.getJobByJobId(user.lastAstrologyJobId);

    if (!job) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Job not found',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Latest astrology job retrieved successfully',
      data: job as any,
    };
  }

  /**
   * @description Retry/recall a failed job
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {string} jobId - The job ID to retry
   * @returns {Promise<ICommonResponse<JobResponseDto>>} A promise that resolves to the new job details
   */
  async retryJob(
    req: IAuthGuardResponse,
    jobId: string,
  ): Promise<ICommonResponse<JobResponseDto>> {
    console.log('===   here ====', jobId);
    const userId = req.userId;

    // Get the original job
    const originalJob = await this.jobModelService.getJobByJobId(jobId);

    if (!originalJob) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Job not found',
        data: null,
      };
    }

    // Verify the job belongs to the user
    if (originalJob.userId.toString() !== userId) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Unauthorized to retry this job',
        data: null,
      };
    }

    // Only allow retrying failed jobs
    if (originalJob.status !== 'failed') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Cannot retry job with status: ${originalJob.status}. Only failed jobs can be retried.`,
        data: originalJob as any,
      };
    }

    // Re-queue the job based on job type
    let newJob;

    console.log('=== originalJob.jobType  ====', originalJob.jobType );
    if (originalJob.jobType.toLowerCase() === 'astrology_reading') {
      newJob = await this.queueService.addAstrologyJob(
        originalJob.jobData,
        originalJob.priority,
      );

      // Update user's lastAstrologyJobId
      await this.userModelService.updateLastAstrologyJobId(userId, newJob.id as string);
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Job type ${originalJob.jobType} retry is not supported`,
        data: null,
      };
    }

    // Get the newly created job from database
    const newJobData = await this.jobModelService.getJobByJobId(newJob.id as string);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Job retry initiated successfully',
      data: newJobData as any,
    };
  }
}
