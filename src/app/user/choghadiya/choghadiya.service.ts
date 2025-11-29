import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { getSunriseSunset } from './utils/sun-calc.util';
import {
  DAY_CHOGHADIYA_MAP,
  NIGHT_CHOGHADIYA_MAP,
  CHOGHADIYA_INFO,
  ChoghadiyaType,
  choghadiyaResponse,
  rahuSegments,
  yamagandaSegments,
  gulikaSegments,
  vaarVelaSegments,
  kaalVelaSegments,
} from './constants/choghadiya.constant';
import { GetChoghadiyaDto, ChoghadiyaResponseDto, ChoghadiyaPeriodDto, ChoghadiyaDataDto } from './dto';
import { IAuthGuardResponse, ICommonResponse } from '@utils/dto';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class ChoghadiyaService {
  private readonly logger = new Logger(ChoghadiyaService.name);

  /**
   * Get Choghadiya for a specific date and location
   */
  async getChoghadiya(req: IAuthGuardResponse, dto: GetChoghadiyaDto): Promise<ICommonResponse<ChoghadiyaResponseDto>> {
    try {
      // Log authenticated user access
      this.logger.log(`User ${req.userId} requesting Choghadiya for date: ${dto.date || 'today'}`);

      // Parse date or use current date
      const date = dto.date ? this.parseLocalDate(dto.date) : new Date();

      // Validate date
      if (isNaN(date.getTime())) {
        throw new BadRequestException(choghadiyaResponse.invalidDate);
      }

      // Validate coordinates
      if (dto.latitude < -90 || dto.latitude > 90 || dto.longitude < -180 || dto.longitude > 180) {
        throw new BadRequestException(choghadiyaResponse.invalidCoordinates);
      }

      // Calculate sunrise and sunset
      const { sunrise, sunset } = getSunriseSunset(date, dto.latitude, dto.longitude);

      // Get day of week (0 = Sunday, 6 = Saturday)
      const weekday = date.getDay();

      // Calculate day Choghadiya
      const dayChoghadiya = this.calculateChoghadiyaPeriods(
        sunrise,
        sunset,
        weekday,
        DAY_CHOGHADIYA_MAP,
        'day',
      );

      // Calculate night Choghadiya (from sunset to next sunrise)
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const { sunrise: nextSunrise } = getSunriseSunset(nextDay, dto.latitude, dto.longitude);

      const nightChoghadiya = this.calculateChoghadiyaPeriods(
        sunset,
        nextSunrise,
        weekday,
        NIGHT_CHOGHADIYA_MAP,
        'night',
      );

      // Format response
      const choghadiyaData: ChoghadiyaDataDto = {
        date: date.toISOString().split('T')[0],
        latitude: dto.latitude,
        longitude: dto.longitude,
        sunrise: sunrise.toISOString(),
        sunset: sunset.toISOString(),
        sunriseFormatted: this.formatTime(sunrise),
        sunsetFormatted: this.formatTime(sunset),
        dayOfWeek: this.getDayName(weekday),
        dayChoghadiya,
        nightChoghadiya,
      };

      return {
        statusCode: HttpStatus.OK,
        message: choghadiyaResponse.success,
        data: {
          choghadiya: choghadiyaData,
        },
      };
    } catch (error) {
      this.logger.error(`Error calculating Choghadiya: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(choghadiyaResponse.calculationError);
    }
  }

  /**
   * Calculate Choghadiya periods for a time range
   */
  private calculateChoghadiyaPeriods(
    startTime: Date,
    endTime: Date,
    weekday: number,
    choghadiyaMap: Record<number, ChoghadiyaType[]>,
    type: 'day' | 'night',
  ): ChoghadiyaPeriodDto[] {
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    const durationMs = endMs - startMs;
    const periodDurationMs = durationMs / 8;

    const results: ChoghadiyaPeriodDto[] = [];
    const choghadiyaSequence = choghadiyaMap[weekday];

    // Kaal Ratri is always the 8th segment of night
    const kaalRatriSeg = type === 'night' ? 8 : null;

    const rahuSeg = rahuSegments[weekday];
    const yamaSeg = yamagandaSegments[weekday];
    const gulikaSeg = gulikaSegments[weekday];
    const vaarSeg = type === 'day' ? vaarVelaSegments[weekday] : null;
    const kaalVelaSeg = type === 'night' ? kaalVelaSegments[weekday] : null;

    for (let i = 0; i < 8; i++) {
      const periodStart = new Date(startMs + i * periodDurationMs);
      const periodEnd = new Date(startMs + (i + 1) * periodDurationMs);
      const choghadiyaType = choghadiyaSequence[i];
      const info = CHOGHADIYA_INFO[choghadiyaType];
      const segmentIndex = i + 1;
      results.push({
        index: segmentIndex,
        name: choghadiyaType,
        nature: info.nature,
        meaning: info.meaning,
        description: info.description,
        startTime: periodStart.toISOString(),
        endTime: periodEnd.toISOString(),
        startTimeFormatted: this.formatTime(periodStart),
        endTimeFormatted: this.formatTime(periodEnd),
        durationMinutes: Math.round(periodDurationMs / 60000),

        // Extra flags (only truthy where appropriate)
        isRahuKalam: type === 'day' ? segmentIndex === rahuSeg : false,
        isYamaganda: type === 'day' ? segmentIndex === yamaSeg : false,

        // Gulika mapping applies for both day & night commonly
        isGulika: segmentIndex === gulikaSeg,
        isVaarVela: type === 'day' ? segmentIndex === vaarSeg : false,
        isKaalVela: type === 'night' ? segmentIndex === kaalVelaSeg : false,
        isKaalRatri: type === 'night' ? segmentIndex === kaalRatriSeg : false,
      });
    }

    return [...results];
  }

  /**
   * Format time to 12-hour format with AM/PM
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Get day name from day number
   */
  private getDayName(dayNumber: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  }

  /**
   * Parse a date string as local date (midnight local time)
   */
  private parseLocalDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00.000Z'); // Treats string as UTC
  }
    // return new Date(year, month - 1, day, 0, 0, 0, 0);  }
}
