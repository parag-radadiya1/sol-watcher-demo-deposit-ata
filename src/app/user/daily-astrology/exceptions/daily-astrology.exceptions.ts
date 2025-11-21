import { BadRequestException } from '@nestjs/common';
import { dailyAstrologyErrors } from '../constants/daily-astrology.constant';

export class UserNotFoundException extends BadRequestException {
  constructor() {
    super(dailyAstrologyErrors.userNotFound);
  }
}

export class IncompleteBirthDetailsException extends BadRequestException {
  constructor() {
    super(dailyAstrologyErrors.incompleteBirthDetails);
  }
}

export class InvalidDateFormatException extends BadRequestException {
  constructor(dateString?: string) {
    super(dailyAstrologyErrors.invalidDateFormat(dateString));
  }
}

export class EndDateBeforeStartException extends BadRequestException {
  constructor() {
    super(dailyAstrologyErrors.endDateBeforeStart);
  }
}

export class DateRangeExceedsLimitException extends BadRequestException {
  constructor(maxDays: number, requested: number) {
    super(dailyAstrologyErrors.dateRangeExceedsLimit(maxDays, requested));
  }
}

export class FutureDateLimitExceededException extends BadRequestException {
  constructor(maxDays: number, maxDate: string) {
    super(dailyAstrologyErrors.futureDateLimitExceeded(maxDays, maxDate));
  }
}

export class PastDateLimitExceededException extends BadRequestException {
  constructor() {
    super(dailyAstrologyErrors.pastDateLimitExceeded);
  }
}

export class FailedToGeneratePredictionsException extends BadRequestException {
  constructor() {
    super(dailyAstrologyErrors.failedToGeneratePredictions);
  }
}

export class FailedToGenerateMarkdownPredictionsException extends BadRequestException {
  constructor() {
    super(dailyAstrologyErrors.failedToGenerateMarkdownPredictions);
  }
}
