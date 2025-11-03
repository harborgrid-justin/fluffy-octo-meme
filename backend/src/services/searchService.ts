// BE-018: Search and Filtering Service
import { SearchQuery, SearchResult } from '../types';
import { dataStore } from './dataStore';

export class SearchService {
  search<T extends { id: string }>(
    collection: string,
    query: SearchQuery
  ): SearchResult<T> {
    let items = dataStore.findAll<T>(collection);

    // Apply filters
    if (query.filters) {
      items = items.filter(item => {
        return Object.entries(query.filters!).every(([key, value]) => {
          const itemValue = (item as any)[key];

          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }

          if (typeof value === 'object' && value !== null) {
            // Handle range queries
            if ('$gte' in value && itemValue < value.$gte) return false;
            if ('$lte' in value && itemValue > value.$lte) return false;
            if ('$gt' in value && itemValue <= value.$gt) return false;
            if ('$lt' in value && itemValue >= value.$lt) return false;
            return true;
          }

          return itemValue === value;
        });
      });
    }

    // Apply text search
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      items = items.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm);
          }
          return false;
        });
      });
    }

    // Apply sorting
    if (query.sort) {
      const { field, order } = query.sort;
      items.sort((a, b) => {
        const aValue = (a as any)[field];
        const bValue = (b as any)[field];

        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Calculate pagination
    const page = query.pagination?.page || 1;
    const limit = query.pagination?.limit || 10;
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const data = items.slice(startIndex, endIndex);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async advancedSearch<T extends { id: string }>(
    collections: string[],
    query: string
  ): Promise<Record<string, T[]>> {
    const results: Record<string, T[]> = {};
    const searchTerm = query.toLowerCase();

    collections.forEach(collection => {
      const items = dataStore.findAll<T>(collection);
      const matches = items.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm);
          }
          return false;
        });
      });

      if (matches.length > 0) {
        results[collection] = matches;
      }
    });

    return results;
  }
}

export const searchService = new SearchService();
