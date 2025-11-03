/**
 * Queue Manager
 *
 * Manages background job queues using Bull (Redis-backed queue).
 * Handles job creation, processing, and monitoring.
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export interface IQueueManager {
  addJob<T>(queueName: string, jobName: string, data: T, options?: JobOptions): Promise<Job>;
  getJob(queueName: string, jobId: string): Promise<Job | undefined>;
  removeJob(queueName: string, jobId: string): Promise<void>;
  pauseQueue(queueName: string): Promise<void>;
  resumeQueue(queueName: string): Promise<void>;
  getQueueMetrics(queueName: string): Promise<QueueMetrics>;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export class QueueManager implements IQueueManager {
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;
  private queueEvents: Map<string, QueueEvents>;
  private connection: Redis;

  constructor(
    private readonly redisConfig: {
      host: string;
      port: number;
      password?: string;
      db?: number;
    }
  ) {
    this.queues = new Map();
    this.workers = new Map();
    this.queueEvents = new Map();

    this.connection = new Redis({
      host: this.redisConfig.host,
      port: this.redisConfig.port,
      password: this.redisConfig.password,
      db: this.redisConfig.db || 0,
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Create or get a queue
   */
  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      this.queues.set(queueName, queue);
      this.setupQueueEvents(queueName);

      console.log(`[QueueManager] Created queue: ${queueName}`);
    }

    return this.queues.get(queueName)!;
  }

  /**
   * Setup queue event listeners
   */
  private setupQueueEvents(queueName: string): void {
    const queueEvents = new QueueEvents(queueName, {
      connection: this.connection,
    });

    queueEvents.on('completed', ({ jobId }) => {
      console.log(`[QueueManager] Job completed: ${queueName}/${jobId}`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[QueueManager] Job failed: ${queueName}/${jobId}`, failedReason);
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`[QueueManager] Job progress: ${queueName}/${jobId}`, data);
    });

    this.queueEvents.set(queueName, queueEvents);
  }

  /**
   * Add a job to a queue
   */
  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job> {
    const queue = this.getQueue(queueName);

    const job = await queue.add(jobName, data, {
      priority: options?.priority,
      delay: options?.delay,
      attempts: options?.attempts,
      backoff: options?.backoff,
      removeOnComplete: options?.removeOnComplete,
      removeOnFail: options?.removeOnFail,
    });

    console.log(`[QueueManager] Added job: ${queueName}/${jobName} (${job.id})`);

    return job;
  }

  /**
   * Register a job processor
   */
  registerProcessor<T>(
    queueName: string,
    processor: (job: Job<T>) => Promise<any>,
    options?: {
      concurrency?: number;
      limiter?: {
        max: number;
        duration: number;
      };
    }
  ): void {
    if (this.workers.has(queueName)) {
      console.warn(`[QueueManager] Worker already registered for queue: ${queueName}`);
      return;
    }

    const worker = new Worker(
      queueName,
      async (job: Job<T>) => {
        console.log(`[QueueManager] Processing job: ${queueName}/${job.name} (${job.id})`);
        return await processor(job);
      },
      {
        connection: this.connection,
        concurrency: options?.concurrency || 5,
        limiter: options?.limiter,
      }
    );

    worker.on('completed', (job) => {
      console.log(`[QueueManager] Worker completed job: ${queueName}/${job.id}`);
    });

    worker.on('failed', (job, error) => {
      console.error(`[QueueManager] Worker failed job: ${queueName}/${job?.id}`, error);
    });

    this.workers.set(queueName, worker);
    console.log(`[QueueManager] Registered worker for queue: ${queueName}`);
  }

  /**
   * Get a specific job
   */
  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      console.log(`[QueueManager] Removed job: ${queueName}/${jobId}`);
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    console.log(`[QueueManager] Paused queue: ${queueName}`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    console.log(`[QueueManager] Resumed queue: ${queueName}`);
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: string): Promise<QueueMetrics> {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused,
    };
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number = 3600000, // 1 hour
    limit: number = 1000
  ): Promise<void> {
    const queue = this.getQueue(queueName);

    const completedJobs = await queue.clean(grace, limit, 'completed');
    const failedJobs = await queue.clean(grace, limit, 'failed');

    console.log(
      `[QueueManager] Cleaned queue ${queueName}: ${completedJobs.length} completed, ${failedJobs.length} failed`
    );
  }

  /**
   * Shutdown all queues and workers
   */
  async shutdown(): Promise<void> {
    console.log('[QueueManager] Shutting down...');

    // Close all workers
    await Promise.all(
      Array.from(this.workers.values()).map(worker => worker.close())
    );

    // Close all queue events
    await Promise.all(
      Array.from(this.queueEvents.values()).map(events => events.close())
    );

    // Close all queues
    await Promise.all(
      Array.from(this.queues.values()).map(queue => queue.close())
    );

    // Close Redis connection
    await this.connection.quit();

    console.log('[QueueManager] Shutdown complete');
  }
}

/**
 * Singleton instance
 */
let queueManagerInstance: QueueManager | null = null;

export function getQueueManager(): QueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_QUEUE_DB || '1'),
    });
  }
  return queueManagerInstance;
}
