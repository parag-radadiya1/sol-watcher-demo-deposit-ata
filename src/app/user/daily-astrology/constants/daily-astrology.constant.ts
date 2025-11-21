export const dailyAstrologyResponse = {
  predictionsRetrievedSuccessfully: (days: number) =>
    `Daily astrology predictions retrieved successfully for ${days} day(s)`,
  markdownPredictionsRetrievedSuccessfully: (days: number) =>
    `Daily astrology predictions in markdown format retrieved successfully for ${days} day(s)`,
};

export const dailyAstrologyErrors = {
  userNotFound: 'User not found',
  incompleteBirthDetails: 'Incomplete birth details. Please update your profile with birth date, place, and name.',
  invalidDateFormat: (dateString?: string) => dateString ? `Invalid date format: "${dateString}". Use YYYY-MM-DD format.` : 'Invalid date format. Use YYYY-MM-DD',
  endDateBeforeStart: 'End date must be after start date',
  dateRangeExceedsLimit: (maxDays: number, requested: number) =>
    `Date range cannot exceed ${maxDays} days. You requested ${requested} days.`,
  futureDateLimitExceeded: (maxDays: number, maxDate: string) =>
    `Cannot predict more than ${maxDays} days into the future. Max date: ${maxDate}`,
  pastDateLimitExceeded: 'Cannot request predictions older than 30 days',
  failedToGeneratePredictions: 'Failed to generate daily predictions',
  failedToGenerateMarkdownPredictions: 'Failed to generate markdown daily predictions',
};
