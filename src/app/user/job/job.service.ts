import { HttpStatus, Injectable } from '@nestjs/common';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import { JobModelService } from '../../../entities/job/job.service';
import {
  JobsListResponseDto,
  JobResponseDto,
  JobStatsResponseDto,
  GetJobsQueryDto,
} from './dto';

@Injectable()
export class JobService {
  constructor(
    private readonly jobModelService: JobModelService,
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
}

