import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

describe('Authentication API Integration Tests', () => {
  let authToken;
  const testUser = {
    username: `testuser${Date.now()}`,
    password: 'TestPass123!',
    email: `testuser${Date.now()}@ppbe.gov`,
    department: 'Testing',
    role: 'user'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: `short${Date.now()}`,
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: `invalid${Date.now()}`,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should reject duplicate username', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: `duplicate${Date.now()}`
        });

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: `duplicate${Date.now()}`,
          email: `different${Date.now()}@ppbe.gov`
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: `logintest${Date.now()}`
        });
      authToken = response.body.token;
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.message).toBe('Login successful');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'somepassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
