export const QUEUE_NAMES = {
  ASTROLOGY_QUEUE: 'astrology-queue',
  USER_QUEUE: 'user-queue',
  BIRTHSTONE_QUEUE: 'birthstone-queue',
} as const;

export const JOB_NAMES = {
  GENERATE_ASTROLOGY_READING: 'generate-astrology-reading',
  PROCESS_USER_REGISTRATION: 'process-user-registration',
  GENERATE_BIRTHSTONE_READING: 'generate-birthstone-reading',
} as const;

export const QUEUE_RATE_LIMITS = {
  OPENAI_MAX_CONCURRENT: 100,
} as const;

export const JOB_TYPES = {
  ASTROLOGY_READING: 'ASTROLOGY_READING',
  USER_REGISTRATION: 'USER_REGISTRATION',
  BIRTHSTONE_READING: 'BIRTHSTONE_READING',
} as const;
