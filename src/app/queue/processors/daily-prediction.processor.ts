import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '@app/queue/constants/queue.constants';
import { IDailyPredictionJobData } from '@app/queue';
import { JobModelService } from '@entities-job/job.service';
import { UserModelService } from '@entities-user/user.service';
import { LangChainService } from '@app/langchain/langchain.service';
import { DailyAstrologyPredictionService as DailyAstrologyPredictionModelService } from '@entities/daily-astrology-prediction/daily-astrology-prediction.service';
import { DailyAstrologyPrediction, DayOfWeek } from '@entities/daily-astrology-prediction/daily-astrology-prediction.entities';
import { Types } from 'mongoose';
import { TokenUsageType } from '@entities/langchain-token-usage/langchain-token-usage.entities';
import { DAILY_ASTROLOGY_SYSTEM_PROMPT, DAILY_ASTROLOGY_USER_PROMPT_TEMPLATE } from '@app/user/daily-astrology/constants/daily-astrology-prompt.constant';
import { ToonParser } from '@app/user/astrology/utils/toon-parser.util';
import { DailyPredictionMarkdownFormatter } from '@app/user/daily-astrology/utils/markdown-formatter.util';

@Processor(QUEUE_NAMES.DAILY_PREDICTION_QUEUE, {
  concurrency: 100,
})
@Injectable()
export class DailyPredictionProcessor extends WorkerHost {
  private readonly logger = new Logger(DailyPredictionProcessor.name);

  constructor(
    private readonly jobModelService: JobModelService,
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
    private readonly dailyAstrologyModelService: DailyAstrologyPredictionModelService,
  ) {
    super();
  }

  async process(job: Job<IDailyPredictionJobData>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    // Set timeout for 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Update job status to active in database
      const existing = await this.jobModelService.getJobByJobId(job.id as string);
      
      // Determine the correct job type based on job name
      const jobType = job.name === JOB_NAMES.GENERATE_DAILY_PREDICTIONS_MARKDOWN 
        ? 'DAILY_PREDICTION_MARKDOWN' 
        : 'DAILY_PREDICTION';
      if (!existing) {
        // Create a minimal record for this job
        await this.jobModelService.createJob({
          jobId: job.id as string,
          userId: job.data?.userId ? new Types.ObjectId(job.data.userId) : undefined,
          jobType: jobType,
          jobData: job.data,
          queueName: QUEUE_NAMES.DAILY_PREDICTION_QUEUE,
          status: 'active',
          progress: 0,
          priority: 0,
          attempts: 0,
        });
      } else {
        await this.jobModelService.updateJobStatus(job.id as string, 'active', {
          startedAt: new Date(),
        });
      }

      let result;

      switch (job.name) {
        case JOB_NAMES.GENERATE_DAILY_PREDICTIONS:
          result = await this.processDailyPredictions(job, false);
          break;

        case JOB_NAMES.GENERATE_DAILY_PREDICTIONS_MARKDOWN:
          result = await this.processDailyPredictions(job, true);
          break;

        default:
          const error = new Error(`Unknown job type: ${job.name}`);
          await this.jobModelService.setJobFailed(job.id as string, error.message);
          throw error;
      }

      // Mark job as completed in database
      await this.jobModelService.setJobCompleted(job.id as string, result);

      return result;
    } catch (error) {
      // Mark job as failed in database
      await this.jobModelService.incrementJobAttempts(job.id as string);
      await this.jobModelService.setJobFailed(
        job.id as string,
        error.message || 'Unknown error',
      );

      this.logger.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process daily predictions generation (both regular and markdown)
   */
  private async processDailyPredictions(job: Job<IDailyPredictionJobData>, isMarkdown: boolean) {
    const { userId, startDate, endDate, forceRegenerate } = job.data;

    this.logger.log(`Generating ${isMarkdown ? 'markdown' : 'regular'} daily predictions for user ${userId}`);

    // Update progress: Starting
    await job.updateProgress(5);
    await this.jobModelService.updateJobProgress(job.id as string, 5);

    // Validate and parse dates
    const startDateObj = this.parseDateString(startDate);
    const endDateObj = this.parseDateString(endDate);
    endDateObj.setUTCHours(23, 59, 59, 999);

    // Get user data
    const user = await this.userModelService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.birthDate || !user.birthPlace || !user.firstName || !user.lastName) {
      throw new Error('User profile incomplete - missing required birth information');
    }

    // Update progress: User data retrieved
    await job.updateProgress(10);
    await this.jobModelService.updateJobProgress(job.id as string, 10);

    // Generate date range
    const datesToProcess = this.generateDateRange(startDateObj, endDateObj);
    const totalDays = datesToProcess.length;

    // Check existing predictions
    const existingPredictions = await this.dailyAstrologyModelService.findByUserAndDateRange(
      userId,
      startDateObj,
      endDateObj,
    );

    const existingPredictionMap = new Map<string, DailyAstrologyPrediction>(
      existingPredictions.map((p) => [this.getDateKey(p.predictionDate), p]),
    );

    // Determine which dates need generation
    const datesToGenerate = forceRegenerate
      ? datesToProcess
      : datesToProcess.filter(
          (date) => !existingPredictionMap.has(this.getDateKey(date)),
        );

    this.logger.log(`Total days: ${totalDays}, Need to generate: ${datesToGenerate.length}, From cache: ${totalDays - datesToGenerate.length}`);

    // Update progress: Starting generation
    await job.updateProgress(15);
    await this.jobModelService.updateJobProgress(job.id as string, 15);

    let newPredictions: DailyAstrologyPrediction[] = [];

    if (datesToGenerate.length > 0) {
      // Generate predictions in parallel with progress tracking
      const progressPerPrediction = 70 / datesToGenerate.length;
      let currentProgress = 15;

      // Generate all predictions in parallel for better performance
      newPredictions = await Promise.all(
        datesToGenerate.map(async (date, index) => {
          const prediction = await this.generateDailyPrediction(userId, date, user);
          
          // Update progress for each completed prediction
          currentProgress += progressPerPrediction;
          await job.updateProgress(Math.min(85, Math.floor(currentProgress)));
          await this.jobModelService.updateJobProgress(job.id as string, Math.min(85, Math.floor(currentProgress)));
          
          return prediction;
        })
      ).then(results => results.filter(prediction => prediction !== null));
    }

    // Update progress: Generation complete
    await job.updateProgress(90);
    await this.jobModelService.updateJobProgress(job.id as string, 90);

    // Combine all predictions
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

    // Format response based on type
    let response;
    if (isMarkdown) {
      // Convert to markdown format per day
      const markdownPredictions = allPredictions.map((p) => ({
        date: this.getDateKey(p.predictionDate),
        dayOfWeek: p.dayOfWeek,
        markdown: DailyPredictionMarkdownFormatter.toMarkdown(p, p.dayOfWeek),
      }));

      response = {
        predictions: markdownPredictions,
        totalDays: allPredictions.length,
        fromCacheCount: existingPredictions.length,
        newGeneratedCount: newPredictions.length,
        dateRange: {
          start: startDateObj.toISOString().split('T')[0],
          end: endDateObj.toISOString().split('T')[0],
        },
      };
    } else {
      // Regular format
      const predictions = allPredictions.map((p) =>
        this.formatPredictionResponse(p, existingPredictionMap),
      );

      response = {
        totalDays: allPredictions.length,
        fromCacheCount: existingPredictions.length,
        newGeneratedCount: newPredictions.length,
        predictions,
        dateRange: {
          start: startDateObj.toISOString().split('T')[0],
          end: endDateObj.toISOString().split('T')[0],
        },
        generatedAt: new Date(),
      };
    }

    // Update progress: Complete
    await job.updateProgress(100);
    await this.jobModelService.updateJobProgress(job.id as string, 100);

    this.logger.log(`Daily predictions completed for user ${userId}`);

    return response;
  }

  /**
   * Generate a single daily prediction using AI
   */
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
      prediction.emotionalAndMentalHealth = parsedData.emotionalAndMentalHealth;
      prediction.physicalHealthAndWellness = parsedData.physicalHealthAndWellness;
      prediction.familyAndSocialLife = parsedData.familyAndSocialLife;
      prediction.luckyElements = parsedData.luckyElements;
      prediction.aiActionPlan = parsedData.aiActionPlan;
      prediction.schemaVersion = 1;
      prediction.generatedBy = 'AI-LangChain';
      prediction.isActive = true;

      // Check if same date record already exists, if so don't create
      const existingPrediction = await this.dailyAstrologyModelService.findByUserAndDate(userId, date);

      if (existingPrediction) {
        this.logger.log(`Prediction already exists for user ${userId}, date ${date.toISOString().split('T')[0]}`);
        return existingPrediction;
      }

      const savedPrediction = await this.dailyAstrologyModelService.create(prediction as any);
      this.logger.log(`Daily prediction saved for user ${userId}, date ${date.toISOString().split('T')[0]}`);
      
      return savedPrediction;
    } catch (error) {
      this.logger.error(
        `Error generating daily prediction for date ${date.toISOString().split('T')[0]}:`,
        error,
      );
      return null;
    }
  }

  // Helper methods
  private parseDateString(dateString: string): Date {
    const date = new Date(dateString);
    date.setUTCHours(0, 0, 0, 0);
    return date;
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
  ): any {
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

