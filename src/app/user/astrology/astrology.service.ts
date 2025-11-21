import { Injectable, HttpStatus } from '@nestjs/common';
import { UserModelService } from '@entities-user/user.service';
import { LangChainService } from '@app/langchain/langchain.service';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import {
  CheckAstrologyDto,
} from './dto/astrology.dto';
import { IAstrologyResponse } from '@app/user/astrology/dto';
import { IncompleteBirthDetailsException, AstrologyServiceException, JobNotFoundException } from './dto/astrology.error';
import { QueueService } from '@app/queue/queue.service';
import { JobModelService } from '@entities-job/job.service';
import { JOB_TYPES } from '@app/queue/constants/queue.constants';
import { AstrologyReadingModelService } from '@entities/astrology-reading/astrology-reading.service';
import { astrologyResponse } from '@utils/constant';

@Injectable()
export class AstrologyService {
  constructor(
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
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
      const fullName = user.middleName
        ? `${user.firstName} ${user.lastName} ${user.middleName}`.trim()
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
            message: astrologyResponse.astrologyReadingRetrievedFromCache,
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
        message: astrologyResponse.astrologyReadingJobQueuedSuccessfully,
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
}
