import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES, JOB_NAMES, QUEUE_RATE_LIMITS, JOB_TYPES } from './constants/queue.constants';
import { JobModelService } from '@entities-job/job.service';
import { Types } from 'mongoose';

export interface IAstrologyJobData {
  userId: string;
  fullName: string;
  birthDate: Date;
  birthPlace: string;
  question?: string;
  forceRegenerate?: boolean;
}

export interface IUserRegistrationJobData {
  userId: string;
  email: string;
  name: string;
}

@Injectable()
export class QueueService {
  private readonly maxConcurrent: number;

  constructor(
    @InjectQueue(QUEUE_NAMES.ASTROLOGY_QUEUE)
    private readonly astrologyQueue: Queue,
    private readonly configService: ConfigService,
    private readonly jobModelService: JobModelService,
  ) {
    this.maxConcurrent = this.configService.get<number>(
      'OPENAI_MAX_CONCURRENT',
      QUEUE_RATE_LIMITS.OPENAI_MAX_CONCURRENT,
    );
  }

  /**
   * Add astrology reading generation job to queue and store in database
   */
  async addAstrologyJob(data: IAstrologyJobData, priority: number = 10) {
    const jobId = `astrology-${data.userId}-${Date.now()}`;

    // Add job to BullMQ queue
    const bullJob = await this.astrologyQueue.add(
      JOB_NAMES.GENERATE_ASTROLOGY_READING,
      data,
      {
        priority,
        jobId,
      },
    );

    // Store job in database
    await this.jobModelService.createJob({
      jobId: bullJob.id as string,
      userId: new Types.ObjectId(data.userId),
      jobType: JOB_TYPES.ASTROLOGY_READING,
      jobData: data,
      queueName: QUEUE_NAMES.ASTROLOGY_QUEUE,
      status: 'waiting',
      progress: 0,
      priority,
      attempts: 0,
    });

    return bullJob;
  }

  /**
   * Add user registration processing job to queue and store in database
   */
  async addUserRegistrationJob(data: IUserRegistrationJobData) {
    const jobId = `user-registration-${data.userId}-${Date.now()}`;

    // Add job to BullMQ queue
    const bullJob = await this.astrologyQueue.add(
      JOB_NAMES.PROCESS_USER_REGISTRATION,
      data,
      {
        priority: 5, // Higher priority for new user processing
        jobId,
      },
    );

    // Store job in database
    await this.jobModelService.createJob({
      jobId: bullJob.id as string,
      userId: new Types.ObjectId(data.userId),
      jobType: JOB_TYPES.USER_REGISTRATION,
      jobData: data,
      queueName: QUEUE_NAMES.ASTROLOGY_QUEUE,
      status: 'waiting',
      progress: 0,
      priority: 5,
      attempts: 0,
    });

    return bullJob;
  }

  /**
   * Update job status in database when job state changes
   */
  async updateJobStatusInDB(jobId: string, status: string, updateData?: any) {
    await this.jobModelService.updateJobStatus(jobId, status, updateData);
  }

  /**
   * Mark job as completed in database
   */
  async markJobCompleted(jobId: string, result: any) {
    await this.jobModelService.setJobCompleted(jobId, result);
  }

  /**
   * Mark job as failed in database
   */
  async markJobFailed(jobId: string, error: string) {
    await this.jobModelService.setJobFailed(jobId, error);
  }

  /**
   * Update job progress in database
   */
  async updateJobProgress(jobId: string, progress: number) {
    await this.jobModelService.updateJobProgress(jobId, progress);
  }

  /**
   * Get job status by job ID from BullMQ
   */
  async getJobStatus(jobId: string) {
    const job = await this.astrologyQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      state: await job.getState(),
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * Get queue statistics from BullMQ
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.astrologyQueue.getWaitingCount(),
      this.astrologyQueue.getActiveCount(),
      this.astrologyQueue.getCompletedCount(),
      this.astrologyQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
