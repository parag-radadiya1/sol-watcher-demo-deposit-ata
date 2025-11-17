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
import {
  ASTROLOGY_SYSTEM_PROMPT,
  ASTROLOGY_USER_PROMPT_TEMPLATE,
  SPECIFIC_QUESTION_TEMPLATE,
} from './constants/astrology-prompt.constant';
import { IAstrologyNumerologyReading } from './interfaces/astrology-reading.interface';
import { QueueService } from '@app/queue/queue.service';
import { JobModelService } from '@entities-job/job.service';
import { JOB_TYPES } from '@app/queue/constants/queue.constants';
import { ToonParser } from './utils/toon-parser.util';

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

        console.log('=== result ====', result);
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

  /**
   * @description Generate astrology and numerology reading using AI
   * @private
   */
  private async generateAstrologyReading(
    fullName: string,
    birthDate: string,
    birthPlace: string,
    question?: string,
  ): Promise<IAstrologyNumerologyReading> {
    try {
      // Build the specific question section
      const specificQuestion = question
        ? SPECIFIC_QUESTION_TEMPLATE.replace('{question}', question)
        : '';

      // Build the complete user prompt
      const userPrompt = ASTROLOGY_USER_PROMPT_TEMPLATE.replace(
        '{fullName}',
        fullName,
      )
        .replace('{birthDate}', birthDate)
        .replace('{birthPlace}', birthPlace)
        .replace('{specificQuestion}', specificQuestion);

      console.log('=== Starting AI astrology reading generation ===');
      console.log('User prompt length:', userPrompt.length, 'characters');

      const startTime = Date.now();

      // Get AI response using LangChain with timeout protection
      const aiResponse = await Promise.race([
        this.langChainService.chatWithContext(
          ASTROLOGY_SYSTEM_PROMPT,
          userPrompt,
        ),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error('AI request timeout after 180 seconds')),
            180000,
          ),
        ),
      ]);

      const endTime = Date.now();
      console.log(
        `=== AI response received in ${(endTime - startTime) / 1000}s ===`,
      );
      console.log('Response length:', aiResponse.length, 'characters');
      console.log('Response preview:', aiResponse.substring(0, 200));

      // Check if response is empty or too short
      if (!aiResponse || aiResponse.trim().length === 0) {
        console.error(
          'Empty AI response received - model may have hit token limits',
        );
        throw new AstrologyServiceException(
          'The AI model did not generate any content. This usually happens when the model hits token limits. Please try again, or contact support if the issue persists.',
        );
      }

      if (aiResponse.length < 100) {
        console.warn('AI response is suspiciously short:', aiResponse);
        throw new AstrologyServiceException(
          'The AI model generated an incomplete response. Please try again.',
        );
      }

      // Parse the JSON response
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('Error generating astrology reading:', error);

      // Better error messages
      if (error.message?.includes('timeout')) {
        throw new AstrologyServiceException(
          'AI request timed out. The astrology reading is taking too long to generate. Please try again or simplify your request.',
        );
      }

      if (error.message?.includes('rate limit')) {
        throw new AstrologyServiceException(
          'API rate limit exceeded. Please wait a moment and try again.',
        );
      }

      if (error.message?.includes('token')) {
        throw new AstrologyServiceException(
          'The request is too large for the AI model. Please try with a shorter question.',
        );
      }

      // Re-throw AstrologyServiceException as-is
      if (error instanceof AstrologyServiceException) {
        throw error;
      }

      throw new AstrologyServiceException(
        error?.message || 'Failed to generate astrology reading from AI',
      );
    }
  }

  /**
   * @description Parse and validate AI response in TOON format
   * @private
   */
  private parseAIResponse(response: string): IAstrologyNumerologyReading {
    try {
      // Clean the TOON response (remove markdown code blocks)
      const cleanedResponse = ToonParser.cleanToonResponse(response);

      console.log('=== Attempting to parse TOON format ===');
      console.log('Cleaned response length:', cleanedResponse.length);
      console.log('Response preview (first 500 chars):', cleanedResponse.substring(0, 500));

      // Parse TOON to JSON
      const parsed = ToonParser.parse(cleanedResponse);

      // Validate basic structure
      if (!ToonParser.validateAstrologyReading(parsed)) {
        throw new Error(
          'Invalid response structure from AI - missing required sections (numerology, astrology, or combinedInsights)',
        );
      }

      console.log('=== Successfully parsed TOON format ===');
      console.log('Parsed structure keys:', Object.keys(parsed));

      return parsed as IAstrologyNumerologyReading;
    } catch (error) {
      console.error('Error parsing AI TOON response:', error);
      console.error('Error details:', error.message);
      console.error(
        'Raw response preview (first 1000 chars):',
        response.substring(0, 1000),
      );
      console.error(
        'Raw response preview (last 500 chars):',
        response.substring(Math.max(0, response.length - 500)),
      );

      throw new AstrologyServiceException(
        'Failed to parse AI response. The AI may not have returned valid TOON format. Please try again or contact support if the issue persists.',
      );
    }
  }

  /**
   * @description Attempt to repair common TOON/JSON issues (legacy support)
   * @private
   */
  private repairJSON(jsonString: string): string {
    // This method is kept for backward compatibility but TOON format is more robust
    return jsonString;
  }
}
