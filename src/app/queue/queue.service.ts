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
  gender: string;
  question?: string;
  forceRegenerate?: boolean;
}

export interface IBirthstoneJobData {
  userId: string;
  fullName: string;
  birthDate: Date;
  birthPlace: string;
  gender: string;
  forceRegenerate?: boolean;
}

export interface IUserRegistrationJobData {
  userId: string;
  email: string;
  name: string;
}

export interface IDailyPredictionJobData {
  userId: string;
  startDate: string;
  endDate: string;
  forceRegenerate?: boolean;
  isMarkdown?: boolean;
}

@Injectable()
export class QueueService {
  private readonly maxConcurrent: number;

  constructor(
    @InjectQueue(QUEUE_NAMES.ASTROLOGY_QUEUE)
    private readonly astrologyQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BIRTHSTONE_QUEUE)
    private readonly birthstoneQueue: Queue,
    @InjectQueue(QUEUE_NAMES.DAILY_PREDICTION_QUEUE)
    private readonly dailyPredictionQueue: Queue,
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

    console.log('===  ==== here in addAstrologyJob', );
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
    const jobData = await this.jobModelService.createJob({
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

    console.log('=== jobData ====', jobData);

    return bullJob;
  }

  /**
   * Add birthstone reading generation job to queue and store in database
   */
  async addBirthstoneJob(data: IBirthstoneJobData, priority: number = 10) {
    const jobId = `birthstone-${data.userId}-${Date.now()}`;

    // Add job to BullMQ queue
    const bullJob = await this.birthstoneQueue.add(
      JOB_NAMES.GENERATE_BIRTHSTONE_READING,
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
      jobType: JOB_TYPES.BIRTHSTONE_READING,
      jobData: data,
      queueName: QUEUE_NAMES.BIRTHSTONE_QUEUE,
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
   * Add daily prediction generation job to queue and store in database
   */
  async addDailyPredictionJob(data: IDailyPredictionJobData, priority: number = 10) {
    const jobType = data.isMarkdown ? 'markdown' : 'regular';
    const jobId = `daily-prediction-${jobType}-${data.userId}-${Date.now()}`;

    // Add job to BullMQ queue
    const bullJob = await this.dailyPredictionQueue.add(
      data.isMarkdown ? JOB_NAMES.GENERATE_DAILY_PREDICTIONS_MARKDOWN : JOB_NAMES.GENERATE_DAILY_PREDICTIONS,
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
      jobType: data.isMarkdown ? JOB_TYPES.DAILY_PREDICTION_MARKDOWN : JOB_TYPES.DAILY_PREDICTION,
      jobData: data,
      queueName: QUEUE_NAMES.DAILY_PREDICTION_QUEUE,
      status: 'waiting',
      progress: 0,
      priority,
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

  // Expose queue instance for admin integrations (e.g., Bull Board)
  getAstrologyQueue() {
    return this.astrologyQueue;
  }

  getBirthstoneQueue() {
    return this.birthstoneQueue
  }

  getDailyPredictionQueue() {
    return this.dailyPredictionQueue;
  }

  /**
   * Get job status by job ID from any queue
   */
  async getJobStatusFromAnyQueue(jobId: string) {
    // Try to find the job in any queue
    const queues = [this.astrologyQueue, this.birthstoneQueue, this.dailyPredictionQueue];

    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
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
    }

    return null;
  }

  /**
   * Cancel an existing job by jobId
   * Removes it from the queue and marks as failed in database
   */
  async cancelJob(jobId: string, reason: string = 'Cancelled by user') {
    try {
      const job = await this.astrologyQueue.getJob(jobId);

      if (job) {
        // Remove the job from the queue
        await job.remove();

        // Mark as failed in database
        await this.jobModelService.setJobFailed(jobId, reason);

        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }
}
