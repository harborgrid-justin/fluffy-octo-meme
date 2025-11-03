/**
 * Domain Event Base Class
 *
 * Domain events represent something that happened in the domain
 * that domain experts care about.
 */

export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType: string;

  constructor() {
    this.occurredAt = new Date();
    this.eventId = this.generateId();
    this.eventType = this.constructor.name;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event payload for serialization
   */
  public abstract getPayload(): Record<string, any>;
}

/**
 * Domain Event Handler Interface
 */
export interface IDomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}
