import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

describe('Program API Integration Tests', () => {
  let authToken;
  let programId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    authToken = response.body.token;
  });

  describe('POST /api/programs', () => {
    it('should create a new program', async () => {
      const programData = {
        name: 'Defense Modernization Program',
        fiscalYear: '2025',
        budget: 5000000,
        department: 'Defense',
        description: 'Modernization of defense systems',
        status: 'planning'
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(programData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(programData.name);
      expect(response.body.budget).toBe(programData.budget);
      expect(response.body.createdBy).toBe('admin');

      programId = response.body.id;
    });

    it('should reject program without authentication', async () => {
      const response = await request(app)
        .post('/api/programs')
        .send({
          name: 'Test Program',
          fiscalYear: '2025',
          budget: 1000000
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject program with invalid data', async () => {
      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Program'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/programs', () => {
    it('should retrieve all programs', async () => {
      const response = await request(app)
        .get('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter programs by fiscal year', async () => {
      const response = await request(app)
        .get('/api/programs?fiscalYear=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter programs by status', async () => {
      const response = await request(app)
        .get('/api/programs?status=planning')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/programs/:id', () => {
    it('should retrieve a specific program', async () => {
      const response = await request(app)
        .get(`/api/programs/${programId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(programId);
      expect(response.body).toHaveProperty('name');
    });

    it('should return 404 for non-existent program', async () => {
      await request(app)
        .get('/api/programs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/programs/:id', () => {
    it('should update a program', async () => {
      const updateData = {
        name: 'Updated Program Name',
        status: 'active'
      };

      const response = await request(app)
        .put(`/api/programs/${programId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/programs/:id', () => {
    it('should delete a program', async () => {
      const response = await request(app)
        .delete(`/api/programs/${programId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
