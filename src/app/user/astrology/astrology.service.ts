import { Injectable, HttpStatus } from '@nestjs/common';
import { UserModelService } from '@entities-user/user.service';
import { LangChainService } from '@app/langchain/langchain.service';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import {
  CheckAstrologyDto,
  IAstrologyResponse,
  IncompleteBirthDetailsException,
  AstrologyServiceException,
} from './dto';
import { AstrologyReadingModelService } from './entities/astrology-reading.service';
import { QueueService } from '@app/queue/queue.service';
import { JobModelService } from '@entities-job/job.service';
import { JOB_TYPES } from '@app/queue/constants/queue.constants';

@Injectable()
export class AstrologyService {
  constructor(
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
    // todo : update this service from model to service
    private readonly astrologyReadingModelService: AstrologyReadingModelService,
    private readonly queueService: QueueService,
    private readonly jobModelService: JobModelService,
  ) {}

  /**
   * @description Get astrology reading for the authenticated user using AI with queue processing
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {CheckAstrologyDto} value - Optional question from user
   * @returns {Promise<ICommonResponse<IAstrologyResponse>>} Astrology reading response or job status
   * @throws {IncompleteBirthDetailsException} If user birth details are incomplete
   * @throws {AstrologyServiceException} If AI service fails
   */
  async checkMyAstrology(
    req: IAuthGuardResponse,
    value: CheckAstrologyDto,
  ): Promise<ICommonResponse<IAstrologyResponse>> {
    try {
      // Get user details from database using userId from auth guard
      const user = await this.userModelService.getUserById(req.userId);

      if (!user) {
        throw new IncompleteBirthDetailsException();
      }

      // Validate that user has all required birth details
      if (!user.birthDate || !user.birthPlace || !user.name) {
        throw new IncompleteBirthDetailsException();
      }

      // Prepare user birth details
      const fullName = user.surname
        ? `${user.firstName} ${user.lastName} ${user.surname}`.trim()
        : `${user.firstName} ${user.lastName}`.trim();

      const birthDateFormatted = new Date(user.birthDate).toLocaleString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        },
      );

      // Check if we have a cached reading (unless force regenerate is requested)
      if (!value?.forceRegenerate) {
        const cachedReading =
          await this.astrologyReadingModelService.findByUserAndBirthDetails(
            req.userId,
            user.birthDate,
            user.birthPlace,
          );

        if (cachedReading) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Astrology reading retrieved from cache',
            data: {
              reading: cachedReading.reading,
              userDetails: {
                fullName,
                birthDate: birthDateFormatted,
                birthPlace: user.birthPlace,
              },
              cached: true,
              generatedAt: cachedReading.generatedAt,
            },
          };
        }
      }

      // Check for existing jobs for this user
      const existingJob = await this.jobModelService.getLatestJobByType(
        req.userId,
        JOB_TYPES.ASTROLOGY_READING,
      );

      // If there's an active or waiting job, cancel it and queue a new one
      if (existingJob && ['waiting', 'active'].includes(existingJob.status)) {
        // Cancel the existing job
        await this.queueService.cancelJob(
          existingJob.jobId,
          'Cancelled - user requested new reading',
        );
        console.log(
          `Cancelled existing job ${existingJob.jobId} for user ${req.userId}`,
        );
      }

      // Queue the astrology job instead of generating synchronously
      const job = await this.queueService.addAstrologyJob({
        userId: req.userId,
        fullName,
        birthDate: user.birthDate,
        birthPlace: user.birthPlace,
        gender: user.gender,
        question: value.question,
        forceRegenerate: value.forceRegenerate,
      });

      // Store the job ID in the user model
      await this.userModelService.updateLastAstrologyJobId(
        req.userId,
        job.id as string,
      );

      console.log(
        `Astrology job queued for user: ${req.userId}, jobId: ${job.id}`,
      );

      // Return job status response
      return {
        statusCode: HttpStatus.ACCEPTED,
        message:
          'Astrology reading job queued successfully. Use the jobId to check status.',
        data: {
          jobId: job.id,
          status: 'waiting',
          message:
            'Your astrology reading is being generated. Please check the job status using the provided jobId.',
          userDetails: {
            fullName,
            birthDate: birthDateFormatted,
            birthPlace: user.birthPlace,
          },
        } as any,
      };
    } catch (error) {
      // Re-throw custom exceptions
      if (error instanceof IncompleteBirthDetailsException) {
        throw error;
      }

      // Log and throw generic astrology service error
      console.error('Astrology service error:', error);
      throw new AstrologyServiceException(
        error?.message || 'Failed to generate astrology reading',
      );
    }
  }

  /**
   * @description Get astrology job status by job ID
   */
  async getJobStatus(jobId: string): Promise<ICommonResponse<any>> {
    try {
      const jobStatus = await this.queueService.getJobStatus(jobId);

      if (!jobStatus) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Job not found',
          data: null,
        };
      }

      console.log('=== jobStatus ====', jobStatus);
      // If job is completed, return the reading
      if (jobStatus.state === 'completed' && jobStatus.returnvalue) {
        const result = jobStatus.returnvalue;

        if (result.cached) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Astrology reading retrieved from cache',
            data: {
              reading: result.reading.reading,
              userDetails: {
                fullName: result.reading.fullName,
                birthDate: result.reading.birthDate,
                birthPlace: result.reading.birthPlace,
              },
              cached: true,
              generatedAt: result.reading.generatedAt,
            },
          };
        }

        return {
          statusCode: HttpStatus.OK,
          message: 'Astrology reading generated successfully',
          data: {
            reading: result.reading.reading,
            userDetails: {
              fullName: result.reading.fullName,
              birthDate: result.reading.birthDate,
              birthPlace: result.reading.birthPlace,
            },
            cached: false,
            generatedAt: result.reading.generatedAt,
          },
        };
      }
    } catch (error) {
      console.error('Error getting job status:', error);
      throw new AstrologyServiceException('Failed to get job status');
    }
  }
}
