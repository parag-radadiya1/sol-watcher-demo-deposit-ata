import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './job.entities';

@Injectable()
export class JobModelService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  async createJob(jobData: Partial<Job>): Promise<JobDocument> {
    const job = new this.jobModel(jobData);
    return job.save();
  }

  async getJobByJobId(jobId: string): Promise<JobDocument | null> {
    return this.jobModel.findOne({ jobId }).exec();
  }

  async getUserJobs(
    userId: string,
    options: {
      jobType?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ jobs: (Job & Record<string, any>)[]; total: number }> {
    const filter: any = { userId };
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    if (options.jobType) {
      filter.jobType = options.jobType;
    }

    if (options.status) {
      filter.status = options.status;
    }

    const [jobs, total] = await Promise.all([
      this.jobModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec(),
      this.jobModel.countDocuments(filter).exec(),
    ]);

    return { jobs, total };
  }

  async getUserJobStats(userId: string): Promise<{
    total: number;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [total, waiting, active, completed, failed, delayed] = await Promise.all([
      this.jobModel.countDocuments({ userId }).exec(),
      this.jobModel.countDocuments({ userId, status: 'waiting' }).exec(),
      this.jobModel.countDocuments({ userId, status: 'active' }).exec(),
      this.jobModel.countDocuments({ userId, status: 'completed' }).exec(),
      this.jobModel.countDocuments({ userId, status: 'failed' }).exec(),
      this.jobModel.countDocuments({ userId, status: 'delayed' }).exec(),
    ]);

    return { total, waiting, active, completed, failed, delayed };
  }

  async getLatestJobByType(userId: string, jobType: string): Promise<(Job & Record<string, any>) | null> {
    return this.jobModel
      .findOne({ userId, jobType })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getJobsByUserId(userId: string): Promise<(Job & Record<string, any>)[]> {
    return this.jobModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async updateJobStatus(
    jobId: string,
    status: string,
    updateData?: Partial<Job>,
  ): Promise<JobDocument | null> {
    return this.jobModel
      .findOneAndUpdate(
        { jobId },
        { status, ...updateData },
        { new: true },
      )
      .exec();
  }

  async updateJobProgress(
    jobId: string,
    progress: number,
  ): Promise<JobDocument | null> {
    return this.jobModel
      .findOneAndUpdate(
        { jobId },
        { progress },
        { new: true },
      )
      .exec();
  }

  async setJobCompleted(
    jobId: string,
    result: any,
  ): Promise<JobDocument | null> {
    return this.jobModel
      .findOneAndUpdate(
        { jobId },
        {
          status: 'completed',
          result,
          completedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async setJobFailed(
    jobId: string,
    error: string,
  ): Promise<JobDocument | null> {
    return this.jobModel
      .findOneAndUpdate(
        { jobId },
        {
          status: 'failed',
          error,
          failedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async incrementJobAttempts(jobId: string): Promise<JobDocument | null> {
    return this.jobModel
      .findOneAndUpdate(
        { jobId },
        { $inc: { attempts: 1 } },
        { new: true },
      )
      .exec();
  }

  async deleteOldJobs(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.jobModel
      .deleteMany({
        status: { $in: ['completed', 'failed'] },
        completedAt: { $lt: cutoffDate },
      })
      .exec();

    return result.deletedCount;
  }
}
