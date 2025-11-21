import { BadRequestException } from '@nestjs/common';
import { IncompleteBirthDetailsException } from '@app/user/astrology/dto';
import { UserNotFoundException } from '@app/user/daily-astrology/dto/daily-astrology.exceptions';
import { InvalidDateFormatException } from '@app/user/daily-astrology/exceptions/daily-astrology.exceptions';

/**
 * Validation utilities for daily astrology predictions
 */
export class DailyAstrologyValidation {
  /**
   * Validate date format (YYYY-MM-DD)
   */
  static isValidDateFormat(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Parse date string to Date object using UTC
   */
  static parseDateString(dateString: string): Date {
    if (!this.isValidDateFormat(dateString)) {
      throw new InvalidDateFormatException(dateString);
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Calculate number of days between two dates
   */
  static getDaysDifference(startDate: Date, endDate: Date): number {
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff;
  }

  /**
   * Get days difference for past/future validation
   */
  static getDaysFromNow(date: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const timeDiff = targetDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if user has required birth details
   */
  static validateUserBirthDetails(user: any): void {
    if (!user) {
      throw new UserNotFoundException();
    }

    if (!user.birthDate) {
      throw new IncompleteBirthDetailsException();
    }

    if (!user.birthPlace) {
      throw new IncompleteBirthDetailsException();
    }

    if (!user.firstName || !user.lastName) {
      throw new IncompleteBirthDetailsException();
    }
  }

  /**
   * Format date for display
   */
  static formatDateForDisplay(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get day of week name from date
   */
  static getDayOfWeekName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Format full date with day name
   */
  static formatFullDate(date: Date): string {
    return `${this.getDayOfWeekName(date)}, ${this.formatDateForDisplay(date)}`;
  }
}
