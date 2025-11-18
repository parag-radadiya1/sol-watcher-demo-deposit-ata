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

@Injectable()
export class DailyAstrologyPredictionService {
  constructor(
    private readonly dailyAstrologyModelService: DailyAstrologyPredictionModelService,
    private readonly userModelService: UserModelService,
    private readonly langChainService: LangChainService,
  ) {}

  async getDailyPredictions(
    req: IAuthGuardResponse,
    dto: GetDailyAstrologyPredictionDto,
  ): Promise<ICommonResponse<DailyAstrologyPredictionsResponseDto>> {
    try {
      const { startDate, endDate, daysCount } = this.validateAndParseDates(dto);
      const user = await this.userModelService.getUserById(req.userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (
        !user.birthDate ||
        !user.birthPlace ||
        !user.firstName ||
        !user.lastName
      ) {
        throw new BadRequestException(
          'Incomplete birth details. Please update your profile with birth date, place, and name.',
        );
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
      const newPredictions: DailyAstrologyPrediction[] = [];
      if (datesToGenerate.length > 0) {
        console.log(
          `Generating predictions for ${datesToGenerate.length} days for user ${req.userId}`,
        );
        for (const date of datesToGenerate) {
          const prediction = await this.generateDailyPrediction(
            req.userId,
            date,
            user,
          );
          if (prediction) {
            newPredictions.push(prediction);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
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
        message: `Daily astrology predictions retrieved successfully for ${daysCount} day(s)`,
        data: response,
      };
    } catch (error) {
      console.error('Error getting daily predictions:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to generate daily predictions',
      );
    }
  }

  /**
   * Get daily predictions in markdown format
   * Returns predictions formatted as markdown per day (similar to wednesday_prediction.md)
   */
  async getDailyPredictionsMarkdown(
    req: IAuthGuardResponse,
    dto: GetDailyAstrologyPredictionDto,
  ): Promise<ICommonResponse<any>> {
    try {
      const { startDate, endDate, daysCount } = this.validateAndParseDates(dto);
      const user = await this.userModelService.getUserById(req.userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (
        !user.birthDate ||
        !user.birthPlace ||
        !user.firstName ||
        !user.lastName
      ) {
        throw new BadRequestException(
          'Incomplete birth details. Please update your profile with birth date, place, and name.',
        );
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
      const newPredictions: DailyAstrologyPrediction[] = [];
      if (datesToGenerate.length > 0) {
        console.log(
          `Generating markdown predictions for ${datesToGenerate.length} days for user ${req.userId}`,
        );
        for (const date of datesToGenerate) {
          const prediction = await this.generateDailyPrediction(
            req.userId,
            date,
            user,
          );
          if (prediction) {
            newPredictions.push(prediction);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
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

      // Convert to markdown format per day
      const markdownPredictions = allPredictions.map((p) => ({
        date: this.getDateKey(p.predictionDate),
        dayOfWeek: p.dayOfWeek,
        markdown: DailyPredictionMarkdownFormatter.toMarkdown(p, p.dayOfWeek),
      }));

      const response = {
        predictions: markdownPredictions,
        totalDays: allPredictions.length,
        fromCacheCount: existingPredictions.length,
        newGeneratedCount: newPredictions.length,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      };

      return {
        statusCode: HttpStatus.OK,
        message: `Daily astrology predictions in markdown format retrieved successfully for ${daysCount} day(s)`,
        data: response,
      };
    } catch (error) {
      console.error('Error getting markdown daily predictions:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to generate markdown daily predictions',
      );
    }
  }

  private validateAndParseDates(dto: GetDailyAstrologyPredictionDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }
    const daysCount = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
      // + 1;
    if (daysCount > DAILY_PREDICTION_CONFIG.MAX_DAYS_RANGE) {
      throw new BadRequestException(
        `Date range cannot exceed ${DAILY_PREDICTION_CONFIG.MAX_DAYS_RANGE} days. You requested ${daysCount} days.`,
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxFutureDate = new Date(today);
    maxFutureDate.setDate(
      maxFutureDate.getDate() + DAILY_PREDICTION_CONFIG.MAX_DAYS_FUTURE,
    );
    if (endDate > maxFutureDate) {
      throw new BadRequestException(
        `Cannot predict more than ${DAILY_PREDICTION_CONFIG.MAX_DAYS_FUTURE} days into the future. Max date: ${maxFutureDate
          .toISOString()
          .split('T')[0]}`,
      );
    }
    const minPastDate = new Date(today);
    minPastDate.setDate(minPastDate.getDate() - 30);
    if (startDate < minPastDate) {
      throw new BadRequestException(
        'Cannot request predictions older than 30 days',
      );
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

