# Background Job Queue System

## Overview

This directory implements a robust background job queue system using Bull/BullMQ (Redis-backed queue) for the Federal PPBE system. It handles asynchronous processing of long-running tasks.

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Application │ Add Job │ Queue Manager│ Process │    Workers   │
│    Layer     │ ──────> │  (Bull/MQ)   │ ──────> │ (Processors) │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                │ Store
                                ▼
                         ┌──────────────┐
                         │    Redis     │
                         │  (Queue DB)  │
                         └──────────────┘
```

## Components

### 1. Queue Manager (`QueueManager.ts`)
Central queue management with multiple queue support.

Features:
- Multiple named queues
- Job priorities
- Delayed jobs
- Job retry with backoff
- Job events and monitoring
- Graceful shutdown

### 2. Job Processors (`jobs/`)
Specialized job processors for different tasks.

Available Jobs:
- `GenerateReportJob.ts` - Report generation
- `SendNotificationJob.ts` - Notification delivery
- `BudgetCalculationJob.ts` - Complex budget calculations
- `DataExportJob.ts` - Bulk data export
- `DataImportJob.ts` - Bulk data import

## Queue Types

### 1. Critical Queue
High-priority, time-sensitive jobs:
- Payment processing
- Budget approvals
- Critical notifications

Settings:
- Priority: 1-10 (1 = highest)
- Concurrency: 10
- Retry: 5 attempts

### 2. Standard Queue
Normal priority jobs:
- Report generation
- Email notifications
- Data synchronization

Settings:
- Priority: 11-50
- Concurrency: 5
- Retry: 3 attempts

### 3. Bulk Queue
Low-priority, high-volume jobs:
- Bulk imports/exports
- Nightly batch processing
- Cache warming

Settings:
- Priority: 51-100
- Concurrency: 2
- Retry: 1 attempt

## Usage Examples

### Adding a Job

```typescript
import { getQueueManager } from './infrastructure/queue/QueueManager';

const queueManager = getQueueManager();

// Add a report generation job
await queueManager.addJob(
  'reports', // queue name
  'generate-budget-report', // job name
  {
    reportId: 'report-123',
    reportType: 'budget-summary',
    format: 'pdf',
    fiscalYearId: 'fy-2025',
    parameters: { includeLineItems: true },
    requestedBy: 'user-456',
  },
  {
    priority: 5, // High priority
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
  }
);
```

### Registering a Job Processor

```typescript
import { getQueueManager } from './infrastructure/queue/QueueManager';
import { processGenerateReportJob } from './infrastructure/queue/jobs/GenerateReportJob';

const queueManager = getQueueManager();

// Register processor for report generation
queueManager.registerProcessor(
  'reports',
  processGenerateReportJob,
  {
    concurrency: 3, // Process 3 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // per second
    },
  }
);
```

### Monitoring Queue Status

```typescript
const metrics = await queueManager.getQueueMetrics('reports');

console.log(`
  Waiting: ${metrics.waiting}
  Active: ${metrics.active}
  Completed: ${metrics.completed}
  Failed: ${metrics.failed}
  Delayed: ${metrics.delayed}
  Paused: ${metrics.paused}
`);
```

## Job Patterns

### 1. Simple Job

One-time execution without retry:

```typescript
await queueManager.addJob('notifications', 'send-email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Welcome to PPBE system',
}, {
  removeOnComplete: true,
});
```

### 2. Delayed Job

Execute job after delay:

```typescript
await queueManager.addJob('reminders', 'send-reminder', {
  userId: 'user-123',
  message: 'Budget approval due tomorrow',
}, {
  delay: 86400000, // 24 hours
});
```

### 3. Recurring Job

Job that runs periodically:

```typescript
await queueManager.addJob('maintenance', 'cleanup-old-data', {
  olderThan: 90, // days
}, {
  repeat: {
    cron: '0 2 * * *', // Every day at 2 AM
  },
});
```

### 4. Priority Job

High-priority job that jumps the queue:

```typescript
await queueManager.addJob('critical', 'process-payment', {
  transactionId: 'txn-123',
  amount: 1000000,
}, {
  priority: 1, // Highest priority
});
```

## Job Lifecycle

```
           Add Job
              │
              ▼
         ┌─────────┐
         │ Waiting │
         └────┬────┘
              │ Worker picks up
              ▼
         ┌─────────┐
         │ Active  │◄──── Retry
         └────┬────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
   ┌─────────┐ ┌─────────┐
   │Completed│ │ Failed  │
   └─────────┘ └─────────┘
```

## Error Handling

### Retry Strategy

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s
  }
}
```

### Custom Error Handling

```typescript
async function processJob(job: Job): Promise<any> {
  try {
    // Job logic
    return await performTask(job.data);
  } catch (error) {
    if (error.isRetryable) {
      // Let Bull retry
      throw error;
    } else {
      // Don't retry
      await handlePermanentFailure(job, error);
      return { status: 'failed', error: error.message };
    }
  }
}
```

## Job Progress

Update progress for long-running jobs:

```typescript
async function processLargeExport(job: Job): Promise<any> {
  const items = await fetchItems();
  const total = items.length;

  for (let i = 0; i < total; i++) {
    await processItem(items[i]);

    // Update progress
    const progress = Math.floor((i + 1) / total * 100);
    await job.updateProgress(progress);
  }

  return { processed: total };
}
```

## Testing

### Unit Tests

```typescript
describe('GenerateReportJob', () => {
  it('should generate PDF report', async () => {
    const job = {
      id: 'job-123',
      data: {
        reportId: 'report-456',
        reportType: 'budget-summary',
        format: 'pdf',
      },
      updateProgress: jest.fn(),
    } as any;

    const processor = new GenerateReportJob();
    const result = await processor.process(job);

    expect(result.filePath).toContain('.pdf');
    expect(job.updateProgress).toHaveBeenCalledWith(100);
  });
});
```

### Integration Tests

```typescript
describe('Queue Integration', () => {
  it('should process job end-to-end', async () => {
    const queueManager = getQueueManager();

    queueManager.registerProcessor('test', async (job) => {
      return { success: true };
    });

    const job = await queueManager.addJob('test', 'test-job', {
      foo: 'bar',
    });

    // Wait for job to complete
    await job.waitUntilFinished(queueEvents);

    const result = await job.getState();
    expect(result).toBe('completed');
  });
});
```

## Monitoring

### Key Metrics

1. **Throughput**: Jobs processed per minute
2. **Latency**: Time from job creation to completion
3. **Failure Rate**: Failed jobs / Total jobs
4. **Queue Depth**: Number of waiting jobs
5. **Worker Utilization**: Active workers / Total workers

### Health Check

```typescript
async function checkQueueHealth(): Promise<boolean> {
  const metrics = await queueManager.getQueueMetrics('critical');

  // Alert if queue is backed up
  if (metrics.waiting > 1000) {
    console.error('Critical queue backed up!');
    return false;
  }

  // Alert if failure rate is high
  const total = metrics.completed + metrics.failed;
  const failureRate = metrics.failed / total;
  if (failureRate > 0.1) {
    console.error('High failure rate!');
    return false;
  }

  return true;
}
```

## Best Practices

### 1. Idempotent Jobs

Jobs should be safe to run multiple times:

```typescript
async function processPayment(job: Job): Promise<any> {
  const { transactionId } = job.data;

  // Check if already processed
  const existing = await db.findTransaction(transactionId);
  if (existing?.status === 'completed') {
    console.log('Transaction already processed');
    return existing;
  }

  // Process payment
  return await processNewPayment(transactionId);
}
```

### 2. Small Job Payloads

Store only essential data in job:

```typescript
// Good - small payload
await queueManager.addJob('reports', 'generate', {
  reportId: 'report-123',
});

// Bad - large payload
await queueManager.addJob('reports', 'generate', {
  reportData: { /* 10MB of data */ },
});
```

### 3. Graceful Shutdown

Handle SIGTERM for clean shutdown:

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await queueManager.shutdown();
  process.exit(0);
});
```

### 4. Dead Letter Queue

Handle permanently failed jobs:

```typescript
queueManager.registerProcessor('reports', async (job) => {
  // Process job
}, {
  failedJobHandler: async (job, error) => {
    // Move to dead letter queue
    await queueManager.addJob('dead-letter', 'failed-job', {
      originalQueue: 'reports',
      jobData: job.data,
      error: error.message,
    });
  },
});
```

## Configuration

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_QUEUE_DB=1

# Queue settings
QUEUE_CONCURRENCY=5
QUEUE_MAX_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=2000
```

## Future Enhancements

1. **Job Scheduling**: Advanced cron-based scheduling
2. **Job Chaining**: Chain multiple jobs together
3. **Job Batching**: Process multiple jobs in batch
4. **Priority Queues**: Separate queues by priority
5. **Rate Limiting**: Per-user or per-tenant rate limits
6. **Job Metrics Dashboard**: Real-time queue monitoring
7. **Job Replay**: Replay failed jobs

## Related Documentation

- [Event-Driven Architecture](../events/README.md)
- [Caching Strategy](../cache/README.md)
- [Background Jobs Pattern](https://docs.bullmq.io/)
