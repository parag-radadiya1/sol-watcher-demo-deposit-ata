import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

/**
 * Custom exceptions for Daily Astrology Prediction module
 */

export class DailyAstrologyException extends BadRequestException {
  constructor(message: string) {
    super({
      statusCode: 400,
      message,
      error: 'DailyAstrologyException',
    });
  }
}

export class InvalidDateRangeException extends DailyAstrologyException {
  constructor(reason: string) {
    super(`Invalid date range: ${reason}`);
  }
}

export class DateRangeTooLargeException extends DailyAstrologyException {
  constructor(requestedDays: number, maxDays: number = 7) {
    super(
      `Date range cannot exceed ${maxDays} days. You requested ${requestedDays} days.`,
    );
  }
}

export class DateTooFarInFutureException extends DailyAstrologyException {
  constructor(requestedDate: string, maxDays: number = 10) {
    super(
      `Cannot predict more than ${maxDays} days into the future. Requested: ${requestedDate}`,
    );
  }
}

export class DateTooFarInPastException extends DailyAstrologyException {
  constructor(requestedDate: string, maxDays: number = 30) {
    super(
      `Cannot request predictions older than ${maxDays} days. Requested: ${requestedDate}`,
    );
  }
}

export class EndDateBeforeStartException extends DailyAstrologyException {
  constructor(startDate: string, endDate: string) {
    super(
      `End date must be after start date. Start: ${startDate}, End: ${endDate}`,
    );
  }
}

export class InvalidDateFormatException extends DailyAstrologyException {
  constructor(dateString: string) {
    super(
      `Invalid date format: "${dateString}". Please use YYYY-MM-DD format.`,
    );
  }
}

export class IncompleteBirthDetailsException extends DailyAstrologyException {
  constructor() {
    super(
      'Incomplete birth details. Please update your profile with birth date, place, and full name.',
    );
  }
}

export class UserNotFoundException extends DailyAstrologyException {
  constructor(userId?: string) {
    super(`User not found: ${userId}`);
  }
}

export class PredictionGenerationException extends InternalServerErrorException {
  constructor(date: string, reason: string) {
    super({
      statusCode: 500,
      message: `Failed to generate prediction for ${date}: ${reason}`,
      error: 'PredictionGenerationException',
    });
  }
}

export class DatabaseStorageException extends InternalServerErrorException {
  constructor(operation: string, reason: string) {
    super({
      statusCode: 500,
      message: `Database operation failed (${operation}): ${reason}`,
      error: 'DatabaseStorageException',
    });
  }
}

export class ToonParsingException extends InternalServerErrorException {
  constructor(reason: string) {
    super({
      statusCode: 500,
      message: `Failed to parse AI response: ${reason}`,
      error: 'ToonParsingException',
    });
  }
}

export class LangChainException extends InternalServerErrorException {
  constructor(reason: string) {
    super({
      statusCode: 500,
      message: `LangChain service error: ${reason}`,
      error: 'LangChainException',
    });
  }
}

