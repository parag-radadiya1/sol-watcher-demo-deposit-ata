# BullMQ Queue Module

This module implements a Redis-based job queue system using BullMQ for handling background jobs with rate limiting.

## Features

- ✅ **Rate Limiting**: Limits OpenAI API calls to 5 concurrent requests (configurable via ENV)
- ✅ **Job Queuing**: Asynchronous processing of astrology readings
- ✅ **User Registration Jobs**: Background processing for new user registrations
- ✅ **Job Status Tracking**: Poll job status and retrieve results
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Job Persistence**: Failed jobs kept for 24 hours, completed for 1 hour

## Installation

The required packages are already installed:
```bash
npm install --save @nestjs/bullmq bullmq ioredis
```

## Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# OpenAI Rate Limiting
OPENAI_MAX_CONCURRENT=5
```

## Setup Redis

### Using Docker (Recommended)
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Using Local Installation
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

## Architecture

### Queue Module Structure
```
src/app/queue/
├── queue.module.ts          # BullMQ module configuration
├── queue.service.ts         # Service for adding jobs to queue
├── processors/
│   └── astrology.processor.ts  # Job processor with rate limiting
├── constants/
│   └── queue.constants.ts   # Queue names and configuration
└── README.md
```

### Flow

1. **User Request** → `POST /user/astrology/check-my-astrology`
2. **Job Creation** → Returns job ID immediately (HTTP 202)
3. **Queue Processing** → Job processed with rate limiting (max 5 concurrent)
4. **Status Polling** → `GET /user/astrology/job-status/:jobId`
5. **Result Retrieval** → Returns astrology reading when complete

## API Endpoints

### Create Astrology Job
```http
POST /user/astrology/check-my-astrology
Authorization: Bearer {token}

Request:
{
  "question": "What does my future hold?",
  "forceRegenerate": false
}

Response (202 Accepted):
{
  "statusCode": 202,
  "message": "Astrology reading generation has been queued...",
  "data": {
    "jobId": "astrology-user123-1699999999999",
    "status": "queued",
    "estimatedTime": "30-60 seconds"
  }
}
```

### Check Job Status
```http
GET /user/astrology/job-status/:jobId
Authorization: Bearer {token}

Response (In Progress):
{
  "statusCode": 200,
  "message": "Job is active",
  "data": {
    "jobId": "astrology-user123-1699999999999",
    "status": "active",
    "progress": 50
  }
}

Response (Completed):
{
  "statusCode": 200,
  "message": "Astrology reading generated successfully",
  "data": {
    "reading": { ... },
    "userDetails": { ... },
    "cached": false,
    "generatedAt": "2025-11-11T10:00:00.000Z"
  }
}
```

## Usage Examples

### Adding a Job to Queue
```typescript
import { QueueService } from '@app/queue/queue.service';

@Injectable()
export class MyService {
  constructor(private readonly queueService: QueueService) {}

  async queueAstrologyReading(userId: string, data: any) {
    const job = await this.queueService.addAstrologyJob({
      userId,
      fullName: data.fullName,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      question: data.question,
    });
    
    return { jobId: job.id };
  }
}
```

### User Registration Hook
The queue automatically creates a background job when a user registers:

```typescript
// In auth.service.ts - registerUser()
await this.queueService.addUserRegistrationJob({
  userId: user._id.toString(),
  email: user.email,
  name: user.name,
});
```

## Queue Configuration

### Rate Limiting
Configured in `queue.constants.ts`:
```typescript
export const QUEUE_RATE_LIMITS = {
  OPENAI_MAX_CONCURRENT: 5,  // Max concurrent OpenAI requests
  OPENAI_RATE_LIMIT_DURATION: 1000,  // 1 second window
};
```

Can be overridden via environment variable:
```env
OPENAI_MAX_CONCURRENT=3
```

### Job Options
```typescript
{
  attempts: 3,              // Retry 3 times on failure
  backoff: {
    type: 'exponential',    // 2s, 4s, 8s delays
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600,              // Keep for 1 hour
    count: 100,
  },
  removeOnFail: {
    age: 86400,             // Keep failed jobs for 24 hours
  },
}
```

## Monitoring

### View Queue Stats
```typescript
const stats = await queueService.getQueueStats();
console.log(stats);
// Output: { waiting: 5, active: 2, completed: 100, failed: 3 }
```

### Bull Board Dashboard (Optional)
Install Bull Board for a web UI:
```bash
npm install @bull-board/api @bull-board/fastify
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Check connection
redis-cli -h localhost -p 6379
```

### Job Stuck in Queue
- Check Redis memory: `redis-cli info memory`
- Restart workers: restart the NestJS application
- Clear queue (dev only): `redis-cli FLUSHDB`

### Rate Limit Too Restrictive
Adjust `OPENAI_MAX_CONCURRENT` in `.env`:
```env
OPENAI_MAX_CONCURRENT=10  # Increase to 10 concurrent jobs
```

## Job Types

### 1. Generate Astrology Reading
- **Name**: `generate-astrology-reading`
- **Purpose**: Process AI-powered astrology readings with rate limiting
- **Priority**: 10 (normal)

### 2. Process User Registration
- **Name**: `process-user-registration`
- **Purpose**: Post-registration tasks
- **Priority**: 5 (high)

## Best Practices

1. **Always Poll Status**: Don't wait synchronously for job completion
2. **Handle Failures**: Jobs auto-retry, but implement fallbacks
3. **Set Timeouts**: Implement client-side timeouts for polling
4. **Monitor Queue**: Check for stuck jobs regularly
5. **Use Cache**: Check for cached results before queuing new jobs

## Performance

- **Throughput**: 5 OpenAI requests per second (configurable)
- **Average Processing Time**: 30-60 seconds per astrology reading
- **Job Overhead**: ~50ms per job creation
- **Redis Memory**: ~1KB per job

## Future Enhancements

- [ ] WebSocket notifications for job completion
- [ ] Bull Board dashboard integration
- [ ] Priority queue for premium users
- [ ] Scheduled cleanup jobs
- [ ] Job analytics and metrics

