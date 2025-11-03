/**
 * Base Entity Class
 *
 * All domain entities should extend this base class.
 * Provides common functionality for identity and domain events.
 */

import { DomainEvent } from './DomainEvent';

export abstract class Entity<T = any> {
  protected readonly _id: string;
  private _domainEvents: DomainEvent[] = [];

  constructor(id: string) {
    this._id = id;
  }

  get id(): string {
    return this._id;
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  /**
   * Add a domain event to be published
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear all domain events (typically after publishing)
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Entity equality based on ID
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Validate entity state
   * Override in concrete entities to add validation rules
   */
  protected abstract validate(): void;
}
