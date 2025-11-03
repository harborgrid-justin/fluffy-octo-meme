import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

describe('Budget API Integration Tests', () => {
  let authToken;
  let budgetId;

  beforeAll(async () => {
    // Login to get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    authToken = response.body.token;
  });

  describe('POST /api/budgets', () => {
    it('should create a new budget', async () => {
      const budgetData = {
        title: 'Test Budget FY2025',
        fiscalYear: '2025',
        amount: 1000000,
        department: 'Defense',
        description: 'Test budget',
        status: 'draft'
      };

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(budgetData.title);
      expect(response.body.amount).toBe(budgetData.amount);
      expect(response.body).toHaveProperty('createdBy', 'admin');
      expect(response.body).toHaveProperty('createdAt');

      budgetId = response.body.id;
    });

    it('should reject budget creation without auth token', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .send({
          title: 'Test Budget',
          fiscalYear: '2025',
          amount: 1000000
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject budget with missing required fields', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Budget'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/budgets', () => {
    it('should retrieve all budgets', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter budgets by fiscal year', async () => {
      const response = await request(app)
        .get('/api/budgets?fiscalYear=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(budget => {
        expect(budget.fiscalYear).toBe('2025');
      });
    });

    it('should filter budgets by department', async () => {
      const response = await request(app)
        .get('/api/budgets?department=Defense')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(budget => {
        expect(budget.department).toBe('Defense');
      });
    });
  });

  describe('GET /api/budgets/:id', () => {
    it('should retrieve a specific budget by ID', async () => {
      const response = await request(app)
        .get(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', budgetId);
      expect(response.body).toHaveProperty('title');
    });

    it('should return 404 for non-existent budget', async () => {
      const response = await request(app)
        .get('/api/budgets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update an existing budget', async () => {
      const updateData = {
        title: 'Updated Budget Title',
        amount: 2000000,
        status: 'approved'
      };

      const response = await request(app)
        .put(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.amount).toBe(updateData.amount);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 when updating non-existent budget', async () => {
      const response = await request(app)
        .put('/api/budgets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete a budget', async () => {
      const response = await request(app)
        .delete(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify deletion
      await request(app)
        .get(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent budget', async () => {
      const response = await request(app)
        .delete('/api/budgets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
