import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
import { DailyAstrologyPredictionService as DailyAstrologyPredictionModelService } from '@entities/daily-astrology-prediction/daily-astrology-prediction.service';
import { DailyAstrologyPrediction, DayOfWeek } from '@entities/daily-astrology-prediction/daily-astrology-prediction.entities';
import { UserModelService } from '@entities-user/user.service';
import { LangChainService } from '@app/langchain/langchain.service';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import { GetDailyAstrologyPredictionDto, DailyAstrologyPredictionsResponseDto, DailyPredictionResponseDto } from './dto';
import { DAILY_ASTROLOGY_SYSTEM_PROMPT, DAILY_ASTROLOGY_USER_PROMPT_TEMPLATE, DAILY_PREDICTION_CONFIG } from './constants/daily-astrology-prompt.constant';
import { ToonParser } from '@app/user/astrology/utils/toon-parser.util';
import { DailyPredictionMarkdownFormatter } from './utils/markdown-formatter.util';

import { TokenUsageType } from '@entities/langchain-token-usage/langchain-token-usage.entities';
import { dailyAstrologyResponse } from './constants/daily-astrology.constant';
import {
  UserNotFoundException,
  EndDateBeforeStartException,
  DateRangeExceedsLimitException,
  FutureDateLimitExceededException,
  PastDateLimitExceededException,
  FailedToGeneratePredictionsException,
} from './exceptions/daily-astrology.exceptions';
import { DailyAstrologyValidation } from './utils/daily-astrology.validation';
import { QueueService } from '@app/queue/queue.service';
import { JobModelService } from '@entities-job/job.service';

@Injectable()
export class DailyAstrologyService {
  constructor(
    private readonly dailyAstrologyModelService: DailyAstrologyPredictionModelService,
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
    private readonly queueService: QueueService,
    private readonly jobModelService: JobModelService,
  ) {}

  async getDailyPredictions(
    req: IAuthGuardResponse,
    dto: GetDailyAstrologyPredictionDto,
  ): Promise<ICommonResponse<DailyAstrologyPredictionsResponseDto>> {
    try {
      const { startDate, endDate, daysCount } = this.validateAndParseDates(dto);
      const user = await this.userModelService.getUserById(req.userId);
      if (!user) {
        throw new UserNotFoundException();
      }
      if (
        !user.birthDate ||
        !user.birthPlace ||
        !user.firstName ||
        !user.middleName
      ) {
        throw new FailedToGeneratePredictionsException();
      }
      const datesToProcess = this.generateDateRange(startDate, endDate);
      const existingPredictions =
        await this.dailyAstrologyModelService.findByUserAndDateRange(
          req.userId,
          startDate,
          endDate,
        );
      const existingPredictionMap = new Map<string, DailyAstrologyPrediction>(
        existingPredictions.map((p) => [this.getDateKey(p.predictionDate), p]),
      );
      const datesToGenerate = dto.forceRegenerate
        ? datesToProcess
        : datesToProcess.filter(
            (date) => !existingPredictionMap.has(this.getDateKey(date)),
          );
      let newPredictions: DailyAstrologyPrediction[] = [];
      if (datesToGenerate.length > 0) {
        console.log(
          `Generating predictions for ${datesToGenerate.length} days for user ${req.userId}`,
        );
        // for (const date of datesToGenerate) {
        //   const prediction = await this.generateDailyPrediction(
        //     req.userId,
        //     date,
        //     user,
        //   );
        //   if (prediction) {
        //     newPredictions.push(prediction);
        //     await new Promise((resolve) => setTimeout(resolve, 500));
        //   }
        // }

        newPredictions = await Promise.all(
          datesToGenerate.map(date =>
            this.generateDailyPrediction(req.userId, date, user)
          )
        ).then(results => results.filter(prediction => prediction !== null));

      }
      const allPredictions = [
        ...existingPredictions.filter((p) =>
          datesToProcess.some((d) => this.isSameDay(d, p.predictionDate)),
        ),
        ...newPredictions,
      ].sort(
        (a, b) =>
          new Date(a.predictionDate).getTime() -
          new Date(b.predictionDate).getTime(),
      );

      const predictions = allPredictions.map((p) =>
        this.formatPredictionResponse(p, existingPredictionMap),
      );
      const response: DailyAstrologyPredictionsResponseDto = {
        totalDays: allPredictions.length,
        fromCacheCount: existingPredictions.length,
        newGeneratedCount: newPredictions.length,
        predictions,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        generatedAt: new Date(),
      };
      return {
        statusCode: HttpStatus.OK,
        message: dailyAstrologyResponse.predictionsRetrievedSuccessfully(daysCount),
        data: response,
      };
    } catch (error) {
      console.error('Error getting daily predictions:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new FailedToGeneratePredictionsException();
    }
  }

  /**
   * Get daily predictions in Markdown format using job queue
   * Returns job information immediately and processes predictions in background
   * If all predictions exist in DB, returns markdown immediately without creating a job
   */
  async getDailyPredictionsMarkdown(
    req: IAuthGuardResponse,
    dto: GetDailyAstrologyPredictionDto,
  ): Promise<ICommonResponse<any>> {
    try {
      // Validate dates first
      const { startDate, endDate, daysCount } = this.validateAndParseDates(dto);
      // Verify user exists and has required data
      const user = await this.userModelService.getUserById(req.userId);
      if (!user) {
        throw new UserNotFoundException();
      }
      if (!user.birthDate || !user.birthPlace || !user.firstName || !user.lastName) {
        throw new FailedToGeneratePredictionsException();
      }
      // STEP 1: Check for MOST RECENT completed job with matching dates
      console.log(`[Step 1] Checking for existing jobs for user ${req.userId}`);
      console.log(`[Step 1] Looking for jobs with dates: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      // Get the most recent job of this type for the user
      const latestJob = await this.jobModelService.getLatestJobByType(
        req.userId,
        'DAILY_PREDICTION_MARKDOWN',
      );
      console.log(`[Step 1] Latest DAILY_PREDICTION_MARKDOWN job:`, latestJob ? {
        jobId: latestJob.jobId,
        status: latestJob.status,
        createdAt: latestJob.createdAt,
        hasResult: !!latestJob.result,
        jobDataStart: latestJob.jobData?.startDate,
        jobDataEnd: latestJob.jobData?.endDate,
      } : 'None found');
      if (latestJob && latestJob.jobData) {
        const jobData = latestJob.jobData as any;
        const isSameRequest = 
          jobData.startDate === startDate.toISOString().split('T')[0] &&
          jobData.endDate === endDate.toISOString().split('T')[0];
        console.log(`[Step 1] Job matches request dates: ${isSameRequest}`);
        // If the latest job is for the same dates and is completed, return it
        if (isSameRequest && latestJob.status === 'completed') {
          if (latestJob.result) {
            console.log(`[Step 1] ✅ Returning completed job ${latestJob.jobId} result`);
            return {
              statusCode: HttpStatus.OK,
              message: 'Daily predictions markdown generation completed.',
              data: {
                ...latestJob.result,
                jobId: latestJob.jobId,
                source: 'job-completed',
              },
            };
          } else {
            console.log(`[Step 1] ⚠️ Completed job has no result, checking database instead`);
          }
        }
        // If the latest job is in progress, return its status
        if (isSameRequest && (latestJob.status === 'waiting' || latestJob.status === 'active')) {
          console.log(`[Step 1] 🔄 Job is in progress, returning status`);
          return {
            statusCode: HttpStatus.ACCEPTED,
            message: `Daily predictions markdown job is ${latestJob.status}. Current progress: ${latestJob.progress || 0}%`,
            data: {
              jobId: latestJob.jobId,
              status: latestJob.status,
              progress: latestJob.progress || 0,
              dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
              },
              totalDays: daysCount,
              estimatedTimeSeconds: daysCount * 2,
              createdAt: latestJob.createdAt,
              source: 'job-in-progress',
            },
          };
        }
      }
      console.log(`[Step 1] No matching completed job found`);
      // STEP 2: Check if all predictions already exist in the database
      console.log(`[Step 2] No recent job found, checking database for predictions`);
      console.log(`[Step 2] Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      const existingPredictions = await this.dailyAstrologyModelService.findByUserAndDateRange(
        req.userId,
        startDate,
        endDate,
      );
      console.log(`[Step 2] Found ${existingPredictions.length} existing predictions in database`);
      console.log(`[Step 2] Existing prediction dates:`, existingPredictions.map(p => this.getDateKey(p.predictionDate)));
      const datesToProcess = this.generateDateRange(startDate, endDate);
      console.log(`[Step 2] Total dates requested: ${datesToProcess.length}`);
      console.log(`[Step 2] Requested dates:`, datesToProcess.map(d => this.getDateKey(d)));
      const existingPredictionMap = new Map<string, DailyAstrologyPrediction>(
        existingPredictions.map((p) => [this.getDateKey(p.predictionDate), p]),
      );
      // Check if we need to generate any predictions
      const missingDates = datesToProcess.filter(
        (date) => !existingPredictionMap.has(this.getDateKey(date)),
      );
      console.log('=== missingDates ====', missingDates);
      if (missingDates.length > 0) {
        console.log(`[Step 2] ❌ Missing ${missingDates.length} predictions for dates: ${missingDates.map(d => this.getDateKey(d)).join(', ')}`);
      } else {
        console.log(`[Step 2] ✅ All predictions found in database!`);
      }
      // If all predictions exist and not forcing regeneration, return markdown immediately
      if (missingDates.length === 0 && !dto.forceRegenerate) {
        console.log(`[Step 2] ✅ Returning all ${existingPredictions.length} predictions from database immediately`);
        // Sort predictions by date
        const sortedPredictions = existingPredictions.sort(
          (a, b) => new Date(a.predictionDate).getTime() - new Date(b.predictionDate).getTime(),
        );
        // Convert to markdown format per day
        const markdownPredictions = sortedPredictions.map((p) => ({
          date: this.getDateKey(p.predictionDate),
          dayOfWeek: p.dayOfWeek,
          markdown: DailyPredictionMarkdownFormatter.toMarkdown(p, p.dayOfWeek),
        }));
        return {
          statusCode: HttpStatus.OK,
          message: dailyAstrologyResponse.markdownPredictionsRetrievedSuccessfully(daysCount),
          data: {
            predictions: markdownPredictions,
            totalDays: sortedPredictions.length,
            fromCacheCount: sortedPredictions.length,
            newGeneratedCount: 0,
            dateRange: {
              start: startDate.toISOString().split('T')[0],
              end: endDate.toISOString().split('T')[0],
            },
            source: 'database',
          },
        };
      }
      // STEP 3: Create job for background processing
      console.log(`[Step 3] 🚀 Creating new job to generate ${missingDates.length} missing predictions`);
      const job = await this.queueService.addDailyPredictionJob({
        userId: req.userId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        forceRegenerate: dto.forceRegenerate || false,
        isMarkdown: true,
      }, 10);
      console.log(`[Step 3] Job created: ${job.id}`);
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Daily predictions markdown generation job has been queued. Use the jobId to check status.',
        data: {
          jobId: job.id,
          status: 'queued',
          dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          totalDays: daysCount,
          missingDays: missingDates.length,
          existingDays: existingPredictions.length,
          estimatedTimeSeconds: missingDates.length * 2,
          source: 'job-new',
        },
      };
    } catch (error) {
      console.error('Error getting daily predictions markdown:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new FailedToGeneratePredictionsException();
    }
  }

  private validateAndParseDates(dto: GetDailyAstrologyPredictionDto) {
    const startDate = DailyAstrologyValidation.parseDateString(dto.startDate);
    const endDate = DailyAstrologyValidation.parseDateString(dto.endDate);
    endDate.setUTCHours(23, 59, 59, 999);
    if (endDate < startDate) {
      throw new EndDateBeforeStartException();
    }
    const daysCount = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysCount > DAILY_PREDICTION_CONFIG.MAX_DAYS_RANGE) {
      throw new DateRangeExceedsLimitException(DAILY_PREDICTION_CONFIG.MAX_DAYS_RANGE, daysCount);
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(
      maxFutureDate.getUTCDate() + DAILY_PREDICTION_CONFIG.MAX_DAYS_FUTURE,
    );
    if (endDate > maxFutureDate) {
      throw new FutureDateLimitExceededException(DAILY_PREDICTION_CONFIG.MAX_DAYS_FUTURE, maxFutureDate.toISOString().split('T')[0]);
    }
    const minPastDate = new Date(today);
    minPastDate.setUTCDate(minPastDate.getUTCDate() - 30);
    if (startDate < minPastDate) {
      throw new PastDateLimitExceededException();
    }
    const dateRange = `${startDate.toISOString().split('T')[0]} to ${endDate
      .toISOString()
      .split('T')[0]}`;
    return { startDate, endDate, dateRange, daysCount };
  }

  private generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }

  private async generateDailyPrediction(
    userId: string,
    date: Date,
    user: any,
  ): Promise<DailyAstrologyPrediction | null> {
    try {
      const dayOfWeek = this.getDayOfWeek(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysAhead = Math.ceil(
        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const sunSign = this.calculateSunSign(user.birthDate);
      const moonSign = user.moonSign || 'Not calculated';
      const risingSign = user.risingSign || 'Not calculated';
      const fullName = user.surname
        ? `${user.firstName} ${user.lastName} ${user.surname}`.trim()
        : `${user.firstName} ${user.lastName}`.trim();
      const birthDateFormatted = new Date(user.birthDate).toLocaleString(
        'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
      );
      const userPrompt = DAILY_ASTROLOGY_USER_PROMPT_TEMPLATE.replace(
        /{fullName}/g,
        fullName,
      )
        .replace(/{birthDate}/g, birthDateFormatted)
        .replace(/{birthPlace}/g, user.birthPlace)
        .replace(/{gender}/g, user.gender)
        .replace(/{sunSign}/g, sunSign)
        .replace(/{moonSign}/g, moonSign)
        .replace(/{risingSign}/g, risingSign)
        .replace(/{dayOfWeek}/g, dayOfWeek)
        .replace(/{predictionDate}/g, date.toISOString().split('T')[0])
        .replace(/{currentDate}/g, today.toISOString().split('T')[0])
        .replace(/{daysAhead}/g, daysAhead.toString());

      const trackingResult = await this.langChainService.chatWithContextAndTracking(
        userId,
        DAILY_ASTROLOGY_SYSTEM_PROMPT,
        userPrompt,
        user.planId,
        TokenUsageType.DAILY_ASTROLOGY
      );
      
      const response = trackingResult.response;
      const parsedData = ToonParser.parse(response);
      const prediction = new DailyAstrologyPrediction();
      prediction.userId = userId;
      prediction.dayOfWeek = dayOfWeek as DayOfWeek;
      prediction.predictionDate = date;
      prediction.overallTheme = parsedData.overallTheme || '';
      prediction.astrologicalInfluence = parsedData.astrologicalInfluence || {};
      prediction.numerologyInfluence = parsedData.numerologyInfluence || {};
      prediction.careerAndWork = parsedData.careerAndWork;
      prediction.moneyAndFinance = parsedData.moneyAndFinance;
      prediction.loveAndRelationships = parsedData.loveAndRelationships;
      prediction.emotionalAndMentalHealth =
        parsedData.emotionalAndMentalHealth;
      prediction.physicalHealthAndWellness =
        parsedData.physicalHealthAndWellness;
      prediction.familyAndSocialLife = parsedData.familyAndSocialLife;
      prediction.luckyElements = parsedData.luckyElements;
      prediction.aiActionPlan = parsedData.aiActionPlan;
      prediction.schemaVersion = 1;
      prediction.generatedBy = 'AI-LangChain';
      prediction.isActive = true;
      // Check if same date record already exists, if so don't create
      const existingPrediction = await this.dailyAstrologyModelService.findByUserAndDate(userId, date);

      console.log('=== date ====', date);
      console.log('=== existingPrediction ====', existingPrediction);
      if (existingPrediction) {
        console.log(`Prediction already exists for user ${userId}, date ${date.toISOString().split('T')[0]}`);
        return existingPrediction;
      }
      

      const savedPrediction =
        await this.dailyAstrologyModelService.create(prediction as any);
      console.log(
        `Daily prediction saved for user ${userId}, date ${date
          .toISOString()
          .split('T')[0]}`,
      );
      return savedPrediction;
    } catch (error) {
      console.error(
        `Error generating daily prediction for date ${date
          .toISOString()
          .split('T')[0]}:`,
        error,
      );
      return null;
    }
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }

  private calculateSunSign(birthDate: Date): string {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const signs = [
      { name: 'Capricorn', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
      { name: 'Aquarius', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
      { name: 'Pisces', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
      { name: 'Aries', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
      { name: 'Taurus', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
      { name: 'Gemini', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
      { name: 'Cancer', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
      { name: 'Leo', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
      { name: 'Virgo', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
      { name: 'Libra', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
      { name: 'Scorpio', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
      { name: 'Sagittarius', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
    ];
    for (const sign of signs) {
      if (sign.startMonth === sign.endMonth) {
        if (
          month === sign.startMonth &&
          day >= sign.startDay &&
          day <= sign.endDay
        ) {
          return sign.name;
        }
      } else {
        if (
          (month === sign.startMonth && day >= sign.startDay) ||
          (month === sign.endMonth && day <= sign.endDay)
        ) {
          return sign.name;
        }
      }
    }
    return 'Unknown';
  }

  private formatPredictionResponse(
    prediction: DailyAstrologyPrediction,
    cacheMap: Map<string, DailyAstrologyPrediction>,
  ): DailyPredictionResponseDto {
    const dateKey = this.getDateKey(prediction.predictionDate);
    const fromCache = cacheMap.has(dateKey);
    const createdAtDate = prediction.createdAt
      ? new Date(prediction.createdAt as any)
      : new Date();
    return {
      date: prediction.predictionDate.toISOString().split('T')[0],
      dayOfWeek: prediction.dayOfWeek,
      fromCache,
      generatedAt: createdAtDate,
      overallTheme: prediction.overallTheme,
      astrologicalInfluence: prediction.astrologicalInfluence,
      numerologyInfluence: prediction.numerologyInfluence,
      careerAndWork: prediction.careerAndWork,
      moneyAndFinance: prediction.moneyAndFinance,
      loveAndRelationships: prediction.loveAndRelationships,
      emotionalAndMentalHealth: prediction.emotionalAndMentalHealth,
      physicalHealthAndWellness: prediction.physicalHealthAndWellness,
      familyAndSocialLife: prediction.familyAndSocialLife,
      luckyElements: prediction.luckyElements,
      aiActionPlan: prediction.aiActionPlan,
      schemaVersion: prediction.schemaVersion,
    };
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return this.getDateKey(date1) === this.getDateKey(date2);
  }
}
