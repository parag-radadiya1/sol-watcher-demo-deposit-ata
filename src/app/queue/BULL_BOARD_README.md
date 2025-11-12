# Bull Board Dashboard & Job Tracking Integration

## Overview

This project now includes:
1. **Bull Board Dashboard** - A web UI to monitor BullMQ queues in real-time
2. **Complete Job Tracking** - Every job is recorded in MongoDB at creation, with updates throughout its lifecycle

## What Was Changed

### 1. Job Database Recording (Fixed & Enhanced)

**File: `src/entities/job/job.service.ts`**
- Fixed TypeScript errors with `.lean()` methods by using proper types
- Methods now correctly return plain objects for lean queries and Mongoose documents for non-lean queries

**File: `src/app/queue/queue.service.ts`**
- Jobs are recorded in MongoDB when added to queue (already working)
- Added `getAstrologyQueue()` method to expose queue for Bull Board

**File: `src/app/queue/processors/astrology.processor.ts`**
- **Job record creation**: When a worker starts processing, it ensures a DB record exists
- **Progress tracking**: All progress updates are saved to MongoDB
- **Lifecycle events**: Added handlers for `active`, `progress`, `completed`, and `failed` events
- **Attempt tracking**: Failed jobs increment the `attempts` counter
- **Non-blocking DB writes**: Event handlers use async IIFEs to avoid blocking the worker

### 2. Bull Board Dashboard Integration

+**Important**: This project uses NestJS 10.x with Fastify 4.x. Bull Board v6.x requires Fastify 5.x, so we use Bull Board v5.x for compatibility.
+
**File: `src/app/queue/bull-board.setup.ts`** (NEW)
- Dynamic import of Bull Board packages (graceful failure if not installed)
- Registers dashboard with Fastify at `/admin/queues`
- Uses NestJS Logger for proper logging

**File: `src/main.ts`**
- Added optional Bull Board initialization
+- **Critical**: Bull Board setup must run BEFORE `app.listen()` because Fastify doesn't allow plugin registration after the server starts
- Only runs when `ENABLE_BULL_BOARD` environment variable is set
- Graceful error handling if setup fails

**File: `package.json`**
-- Added Bull Board dependencies (already present):
-  - `@bull-board/api`
-  - `@bull-board/fastify`
-  - `@bull-board/ui`
+- Added Bull Board v5.x dependencies (compatible with Fastify 4.x):
+  - `@bull-board/api@^5.23.0`
+  - `@bull-board/fastify@^5.23.0`
+  - `@bull-board/ui@^5.23.0`
+
+**Note**: Do NOT upgrade to Bull Board v6.x unless you also upgrade to NestJS with Fastify 5.x support.

## How to Use

### 1. Install Dependencies (if not already installed)

```bash
npm install
```

The Bull Board packages are already in your `package.json`, so this will install them.

### 2. Enable Bull Board Dashboard

Set the environment variable:

```bash
export ENABLE_BULL_BOARD=true
# or ENABLE_BULL_BOARD=1
# or ENABLE_BULL_BOARD=yes
```

Or add it to your `.env` file:

```env
ENABLE_BULL_BOARD=true
```

### 3. Start the Application

```bash
npm run start:dev
```

### 4. Access the Dashboard

Open your browser and navigate to:

```
http://localhost:8000/admin/queues
```

You'll see:
- Real-time queue statistics (waiting, active, completed, failed)
- Individual job details
- Job data and results
- Retry/delete/promote job actions
- Progress indicators

## Job Tracking in MongoDB

Every job is now tracked in the `jobs` collection with the following lifecycle:

### When Job is Added
```javascript
{
  jobId: "astrology-userId-timestamp",
  userId: ObjectId("..."),
  jobType: "ASTROLOGY_READING",
  jobData: { fullName, birthDate, birthPlace, question },
  queueName: "astrology-queue",
  status: "waiting",
  progress: 0,
  priority: 10,
  attempts: 0,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### When Worker Picks Up Job
```javascript
{
  status: "active",
  startedAt: ISODate("...")
}
```

### During Processing
```javascript
{
  progress: 10  // then 20, 70, 100...
}
```

### On Success
```javascript
{
  status: "completed",
  result: { userId, fullName, reading, ... },
  completedAt: ISODate("...")
}
```

### On Failure
```javascript
{
  status: "failed",
  error: "Error message...",
  attempts: 1,  // incremented on each failure
  failedAt: ISODate("...")
}
```

## API Reference

### QueueService Methods

```typescript
// Add a job and create DB record
await queueService.addAstrologyJob({
  userId: "...",
  fullName: "John Doe",
  birthDate: new Date(),
  birthPlace: "New York",
  question: "What's my future?"
}, priority);

// Add user registration job
await queueService.addUserRegistrationJob({
  userId: "...",
  email: "user@example.com",
  name: "John Doe"
});

// Get job status from BullMQ
const status = await queueService.getJobStatus(jobId);

// Get queue statistics
const stats = await queueService.getQueueStats();
```

### JobModelService Methods

```typescript
// Create job record
await jobModelService.createJob(jobData);

// Get job by ID
const job = await jobModelService.getJobByJobId(jobId);

// Get user's jobs with pagination
const { jobs, total } = await jobModelService.getUserJobs(userId, {
  jobType: 'ASTROLOGY_READING',
  status: 'completed',
  page: 1,
  limit: 20
});

// Get user job statistics
const stats = await jobModelService.getUserJobStats(userId);

// Update job status
await jobModelService.updateJobStatus(jobId, 'active', {
  startedAt: new Date()
});

// Update progress
await jobModelService.updateJobProgress(jobId, 50);

// Mark completed
await jobModelService.setJobCompleted(jobId, result);

// Mark failed
await jobModelService.setJobFailed(jobId, errorMessage);

// Increment attempts
await jobModelService.incrementJobAttempts(jobId);

// Clean old jobs
const deletedCount = await jobModelService.deleteOldJobs(30); // 30 days
```

## Job Lifecycle Guarantees

### 1. **Every Job is Recorded**
- When added via `QueueService`, a DB record is created immediately
- If a job is added externally (e.g., from another service), the processor creates a record when it starts

### 2. **Progress is Tracked**
- All `job.updateProgress()` calls in the processor also update MongoDB
- Progress event handlers ensure updates even if processor forgets to call explicitly

### 3. **Failures are Logged**
- Failed jobs increment `attempts` counter
- Error messages are stored in the `error` field
- `failedAt` timestamp is recorded

### 4. **Completions are Stored**
- Successful jobs store their result in the `result` field
- `completedAt` timestamp is recorded
- Status is set to `completed`

## Security Considerations

⚠️ **Important**: The Bull Board dashboard is currently accessible without authentication at `/admin/queues`.

### Recommended Security Measures

1. **Restrict by Environment**
   ```typescript
   // Only enable in development
   if (configService.get('ENV') === 'DEV') {
     const enableBullBoard = configService.get<string>('ENABLE_BULL_BOARD');
     // ...
   }
   ```

2. **Add Authentication Middleware**
   ```typescript
   // In bull-board.setup.ts, add auth before registering
   app.addHook('onRequest', async (request, reply) => {
     if (request.url.startsWith('/admin/queues')) {
       // Check admin token/session
       if (!isAdmin(request)) {
         reply.code(403).send({ error: 'Forbidden' });
       }
     }
   });
   ```

3. **Use Environment Variables**
   ```env
   ENABLE_BULL_BOARD=false  # Disable in production
   ```

4. **IP Whitelist** (in production)
   Only allow access from specific IPs (e.g., VPN, office network)

## Monitoring & Maintenance

### Check Job Statistics
```typescript
const stats = await jobModelService.getUserJobStats(userId);
console.log(`Total: ${stats.total}, Failed: ${stats.failed}`);
```

### Clean Old Completed Jobs
```typescript
// Delete jobs completed more than 30 days ago
const deletedCount = await jobModelService.deleteOldJobs(30);
```

### Query Jobs
```typescript
// Get recent failed jobs
const { jobs } = await jobModelService.getUserJobs(userId, {
  status: 'failed',
  page: 1,
  limit: 10
});
```

## Troubleshooting

### Bull Board Not Showing
1. Check `ENABLE_BULL_BOARD` is set to `true`, `1`, or `yes`
2. Check console logs for Bull Board initialization messages
3. Verify packages are installed: `npm list | grep bull-board`
4. Check Redis is running and accessible

### Jobs Not Appearing in DB
1. Check MongoDB connection
2. Verify `JobModelModule` is imported in `QueueModule`
3. Check console for DB write errors in processor logs
4. Verify job service is injected properly

### Dashboard Shows Jobs But DB is Empty
- This means Bull Board is reading from Redis (BullMQ) but DB writes are failing
- Check the processor logs for MongoDB errors
- Verify the job model schema matches your MongoDB setup

## Architecture

```
┌─────────────────┐
│   Client API    │
└────────┬────────┘
         │ addJob()
         ▼
┌─────────────────┐      ┌──────────────┐
│  QueueService   │─────▶│   MongoDB    │
│                 │      │  (jobs coll) │
└────────┬────────┘      └──────────────┘
         │ add to BullMQ
         ▼
┌─────────────────┐
│   Redis Queue   │◀────┐
└────────┬────────┘     │
         │              │ Bull Board
         ▼              │ reads from
┌─────────────────┐     │
│    Processor    │     │
│  (Worker Host)  │     │
└────────┬────────┘     │
         │              │
         ├──────────────┘
         │ updates
         ▼
┌─────────────────┐
│    MongoDB      │
│  (progress,     │
│   status, etc)  │
└─────────────────┘
```

## Next Steps

1. **Add More Queues**: Expand Bull Board to monitor additional queues
2. **Custom Job Types**: Define more job types in `constants/queue.constants.ts`
3. **Scheduled Jobs**: Use BullMQ's repeat/cron features for scheduled tasks
4. **Alerts**: Set up notifications for failed jobs
5. **Analytics**: Build dashboards using the job data in MongoDB

## Summary

✅ **TypeScript errors fixed** - All compilation errors resolved  
✅ **Bull Board integrated** - Dashboard available at `/admin/queues`  
✅ **Job tracking complete** - Every job recorded at creation  
✅ **Lifecycle events handled** - Progress, completion, and failure all tracked  
✅ **Build successful** - Project compiles without errors  
✅ **Ready to use** - Just set `ENABLE_BULL_BOARD=true` and start the app
