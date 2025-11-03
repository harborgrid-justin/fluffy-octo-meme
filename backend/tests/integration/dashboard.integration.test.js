import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

describe('Dashboard API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    authToken = response.body.token;
  });

  describe('GET /api/dashboard/summary', () => {
    it('should return dashboard summary statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalBudget');
      expect(response.body).toHaveProperty('totalPrograms');
      expect(response.body).toHaveProperty('activePrograms');
      expect(response.body).toHaveProperty('totalExecuted');
      expect(response.body).toHaveProperty('budgetUtilization');
      expect(response.body).toHaveProperty('departments');
      expect(response.body).toHaveProperty('pendingApprovals');

      expect(typeof response.body.totalBudget).toBe('number');
      expect(typeof response.body.totalPrograms).toBe('number');
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/dashboard/summary')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/budget-by-department', () => {
    it('should return budget breakdown by department', async () => {
      const response = await request(app)
        .get('/api/dashboard/budget-by-department')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('department');
        expect(response.body[0]).toHaveProperty('amount');
      }
    });
  });

  describe('GET /api/dashboard/execution-timeline', () => {
    it('should return execution timeline data', async () => {
      const response = await request(app)
        .get('/api/dashboard/execution-timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/fiscal-years', () => {
    it('should return fiscal years', async () => {
      const response = await request(app)
        .get('/api/fiscal-years')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('year');
        expect(response.body[0]).toHaveProperty('status');
        expect(response.body[0]).toHaveProperty('startDate');
        expect(response.body[0]).toHaveProperty('endDate');
      }
    });
  });
});
