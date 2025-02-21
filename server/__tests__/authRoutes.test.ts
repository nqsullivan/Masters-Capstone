import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index.js';
import AuthService from '../src/services/auth.js';
import DatabaseAccess from '../src/services/database.js';
import { verifyToken } from '../src/controllers/auth.js';
import { expect, test, describe, beforeAll } from '@jest/globals';
import { jest } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Auth API', () => {
  beforeAll(async () => {
    await AuthService.init();

    const db = await DatabaseAccess.getInstance();
    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');
  });

  test('POST /api/register should register a user', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ username: 'testUser2', password: 'securePassword' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('username', 'testUser2');
  });

  test('POST /api/register should return 400 for an already taken username', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'testUser', password: 'testPass' });

    const response = await request(app)
      .post('/api/register')
      .send({ username: 'testUser', password: 'testPass' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Username already taken');
  });

  test('POST /api/login should return a token for valid credentials', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'testUser', password: 'testPass' });

    const response = await request(app)
      .post('/api/login')
      .send({ username: 'testUser', password: 'testPass' });

    expect(response.status).toBe(200);
    expect(typeof response.text).toBe('string');
    expect(response.text.length).toBeGreaterThan(0);
  });

  test('POST /api/login should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'testUser', password: 'wrongPassword' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  test('Verify token middleware should return 401 for invalid token', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalidToken',
      },
    } as express.Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('Verify token middleware should call next for valid token', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'testUser', password: 'testPass' });

    const response = await request(app)
      .post('/api/login')
      .send({ username: 'testUser', password: 'testPass' });

    const req = {
      headers: {
        authorization: `Bearer ${response.text}`,
      },
    } as express.Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('Verify token middleware should return 401 for no authorization header', async () => {
    const req = {
      headers: {},
    } as express.Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
