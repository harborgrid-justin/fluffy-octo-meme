/**
 * Event Bus Implementation
 *
 * Central event dispatcher for domain events.
 * Supports synchronous and asynchronous event handling.
 */

import { EventEmitter } from 'events';
import { DomainEvent, IDomainEventHandler } from '../../domain/shared/DomainEvent';

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void;
  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void;
}

export class EventBus implements IEventBus {
  private emitter: EventEmitter;
  private handlers: Map<string, IDomainEventHandler<any>[]>;
  private isAsync: boolean;

  constructor(isAsync: boolean = true) {
    this.emitter = new EventEmitter();
    this.handlers = new Map();
    this.isAsync = isAsync;
  }

  /**
   * Publish a single event
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    console.log(`[EventBus] Publishing event: ${eventType}`);

    if (this.isAsync) {
      // Asynchronous - don't wait for handlers
      this.emitter.emit(eventType, event);

      // Execute handlers without blocking
      Promise.all(
        handlers.map(handler =>
          this.executeHandler(handler, event).catch(error => {
            console.error(`[EventBus] Error in async handler for ${eventType}:`, error);
          })
        )
      );
    } else {
      // Synchronous - wait for all handlers
      await Promise.all(
        handlers.map(handler => this.executeHandler(handler, event))
      );
    }
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);
    console.log(`[EventBus] Subscribed handler to event: ${eventType}`);
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      console.log(`[EventBus] Unsubscribed handler from event: ${eventType}`);
    }
  }

  /**
   * Execute a single handler with error handling
   */
  private async executeHandler<T extends DomainEvent>(
    handler: IDomainEventHandler<T>,
    event: T
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(
        `[EventBus] Error handling event ${event.eventType}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get number of handlers for an event type
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * Clear all handlers
   */
  clearAllHandlers(): void {
    this.handlers.clear();
    this.emitter.removeAllListeners();
  }
}

/**
 * Singleton instance for application-wide use
 */
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(true);
  }
  return eventBusInstance;
}

export function setEventBus(eventBus: EventBus): void {
  eventBusInstance = eventBus;
}
