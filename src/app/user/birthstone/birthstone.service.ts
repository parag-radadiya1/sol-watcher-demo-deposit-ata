import { Injectable, HttpStatus } from '@nestjs/common';
import { UserModelService } from '@entities-user/user.service';
import { LangChainService } from '@app/langchain/langchain.service';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import {
  CheckBirthstoneDto,
} from './dto/birthstone.dto';
import { IBirthstoneResponse, IBirthstoneMarkdownResponse, IBirthstoneOverviewResponse } from '@app/user/birthstone/dto';
import { IncompleteBirthDetailsException, BirthstoneServiceException } from '@app/user/birthstone/dto';
import { birthstoneResponse } from '@utils/constant';
import { BirthstoneReadingModelService } from '@entities/birthstone-reading/birthstone-reading.service';
import { QueueService } from '@app/queue/queue.service';
import { JobModelService } from '@entities-job/job.service';
import { JOB_TYPES } from '@app/queue/constants/queue.constants';
import { BirthstoneMarkdownFormatter } from './utils/birthstone-markdown-formatter.util';

@Injectable()
export class BirthstoneService {
  constructor(
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
    private readonly birthstoneReadingModelService: BirthstoneReadingModelService,
    private readonly queueService: QueueService,
    private readonly jobModelService: JobModelService,
  ) {}

  /**
   * @description Get birthstone reading for the authenticated user using AI with queue processing
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {CheckBirthstoneDto} value - Optional force regenerate flag
   * @returns {Promise<ICommonResponse<IBirthstoneResponse>>} Birthstone reading response or job status
   * @throws {IncompleteBirthDetailsException} If user birth details are incomplete
   * @throws {BirthstoneServiceException} If AI service fails
   */
  async getMyBirthstone(
    req: IAuthGuardResponse,
    value: CheckBirthstoneDto,
  ): Promise<ICommonResponse<IBirthstoneResponse>> {
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
      const fullName = user.  middleName
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
          await this.birthstoneReadingModelService.findByUserAndBirthDetails(
            req.userId,
            user.birthDate,
            user.birthPlace,
          );

        if (cachedReading) {
          // Convert to Markdown format
          const markdown = BirthstoneMarkdownFormatter.toMarkdown(
            cachedReading.reading,
          );

          return {
            statusCode: HttpStatus.OK,
            message: birthstoneResponse.birthstoneReadingRetrievedFromCache,
            data: {
              reading: cachedReading.reading,
              markdown,
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
        JOB_TYPES.BIRTHSTONE_READING,
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

      // Queue the birthstone job instead of generating synchronously
      const job = await this.queueService.addBirthstoneJob({
        userId: req.userId,
        fullName,
        birthDate: user.birthDate,
        birthPlace: user.birthPlace,
        gender: user.gender,
        forceRegenerate: value?.forceRegenerate,
      });

      // Store the job ID in the user model
      await this.userModelService.updateLastBirthstoneJobId(
        req.userId,
        job.id as string,
      );

      console.log(
        `Birthstone job queued for user: ${req.userId}, jobId: ${job.id}`,
      );

      // Return job status response
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: birthstoneResponse.birthstoneReadingJobQueuedSuccessfully,
        data: {
          jobId: job.id,
          status: 'waiting',
          message:
            'Your birthstone reading is being generated. Please check the job status using the provided jobId.',
          userDetails: {
            fullName,
            birthDate: user.birthDate.toISOString(),
            birthPlace: user.birthPlace,
          },
        },
      };
    } catch (error) {
      console.error('Birthstone service error:', error);
      if (
        error instanceof IncompleteBirthDetailsException ||
        error instanceof BirthstoneServiceException
      ) {
        throw error;
      }
      throw new BirthstoneServiceException(error.message);
    }
  }

  /**
   * @description Get birthstone reading in Markdown format
   * Returns birthstone reading formatted as markdown (similar to birthstone_overview.md)
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @param {CheckBirthstoneDto} value - Optional force regenerate flag
   * @returns {Promise<ICommonResponse<IBirthstoneMarkdownResponse>>} Birthstone reading as markdown string
   * @throws {IncompleteBirthDetailsException} If user birth details are incomplete
   * @throws {BirthstoneServiceException} If AI service fails
   */
  async getMyBirthstoneMarkdown(
    req: IAuthGuardResponse,
    value: CheckBirthstoneDto,
  ): Promise<ICommonResponse<IBirthstoneMarkdownResponse>> {
    try {
      // Get user details from database
      const user = await this.userModelService.getUserById(req.userId);

      if (!user) {
        throw new IncompleteBirthDetailsException();
      }

      // Validate that user has all required birth details
      if (!user.birthDate || !user.birthPlace || !user.name) {
        throw new IncompleteBirthDetailsException();
      }

      // Prepare user birth details
      const fullName = user.lastName
        ? `${user.firstName} ${user.middleName} ${user.lastName}`.trim()
        : `${user.firstName} ${user.middleName}`.trim();

      // Check if we have a cached reading (unless force regenerate is requested)
      if (!value?.forceRegenerate) {
        const cachedReading =
          await this.birthstoneReadingModelService.findByUserAndBirthDetails(
            req.userId,
            user.birthDate,
            user.birthPlace,
          );

        if (cachedReading && cachedReading.reading) {
          // Convert to Markdown format
          const markdown = BirthstoneMarkdownFormatter.toMarkdown(
            cachedReading.reading,
          );

          return {
            statusCode: HttpStatus.OK,
            message: birthstoneResponse.birthstoneReadingInMarkdownFormatRetrievedSuccessfully,
            data: {
              markdown,
              userDetails: {
                fullName,
                birthDate: user.birthDate.toISOString(),
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
        JOB_TYPES.BIRTHSTONE_READING,
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

      // Queue the birthstone job instead of generating synchronously
      const job = await this.queueService.addBirthstoneJob({
        userId: req.userId,
        fullName,
        birthDate: user.birthDate,
        birthPlace: user.birthPlace,
        gender: user.gender,
        forceRegenerate: value?.forceRegenerate,
      });

      // Store the job ID in the user model
      await this.userModelService.updateLastBirthstoneJobId(
        req.userId,
        job.id as string,
      );

      console.log(
        `Birthstone job queued for user: ${req.userId}, jobId: ${job.id}`,
      );

      // Return job status response
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: birthstoneResponse.birthstoneReadingJobQueuedSuccessfully,
        data: {
          jobId: job.id,
          status: 'waiting',
          message:
            'Your birthstone reading is being generated. Please check the job status using the provided jobId.',
          userDetails: {
            fullName,
            birthDate: user.birthDate.toISOString(),
            birthPlace: user.birthPlace,
          },
        },
      };
    } catch (error) {
      console.error('Birthstone markdown service error:', error);
      if (
        error instanceof IncompleteBirthDetailsException ||
        error instanceof BirthstoneServiceException
      ) {
        throw error;
      }
      throw new BirthstoneServiceException(error.message);
    }
  }

  /**
   * @description Get birthstone overview - simple API for frontend
   * @param {IAuthGuardResponse} req - The authenticated request with user info
   * @returns {Promise<ICommonResponse<any>>} Birthstone overview
   */
  async getBirthstoneOverview(
    req: IAuthGuardResponse,
  ): Promise<ICommonResponse<IBirthstoneOverviewResponse>> {
    try {
      // Get user details
      const user = await this.userModelService.getUserById(req.userId);

      if (!user || !user.birthDate) {
        throw new IncompleteBirthDetailsException();
      }

      // Check for cached reading
      const cachedReading =
        await this.birthstoneReadingModelService.findByUserAndBirthDetails(
          req.userId,
          user.birthDate,
          user.birthPlace || 'Unknown',
        );

      if (cachedReading && cachedReading.reading) {
        return {
          statusCode: HttpStatus.OK,
          message: birthstoneResponse.birthstoneOverviewRetrievedSuccessfully,
          data: {
            overview: cachedReading.reading.overview,
            birthstoneCategories: cachedReading.reading.birthstoneCategories,
            meaningSymbolism: cachedReading.reading.meaningSymbolism,
            keyBenefits: cachedReading.reading.keyBenefits,
            howToWear: cachedReading.reading.howToWear,
            generatedAt: cachedReading.generatedAt,
          },
        };
      }

      // No cached reading, return basic info and suggest generating full reading
      const birthMonth = new Date(user.birthDate).toLocaleString('en-US', {
        month: 'long',
      });

      return {
        statusCode: HttpStatus.OK,
        message: birthstoneResponse.noBirthstoneReadingFoundGenerateFirst,
        data: {
          birthMonth,
          hasReading: false,
          suggestion: 'Call the /get-my-birthstone endpoint to generate your personalized birthstone reading',
        },
      };
    } catch (error) {
      console.error('Birthstone overview error:', error);
      if (error instanceof IncompleteBirthDetailsException) {
        throw error;
      }
      throw new BirthstoneServiceException(error.message);
    }
  }
}
