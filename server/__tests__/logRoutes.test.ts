import TestUtils from './utils';
import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Log API', () => {
  let token: string | null = '';
  beforeAll(async () => {
    token = await TestUtils.getValidToken();
  });

  test('POST /api/log should return 200 for valid request', async () => {
    const response = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'LOGIN' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('action', 'LOGIN');
  });

  test('GET /api/log/{id} should return 200 for valid log ID', async () => {
    const logResponse = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'SCAN' });

    const response = await request(app)
      .get(`/api/log/${logResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('action', 'SCAN');
  });

  test('GET /api/log/{id} should return 400 for invalid log ID', async () => {
    const response = await request(app)
      .get('/api/log/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Log with id 'invalidId' not found"
    );
  });

  test('DELETE /api/log/{id} should return 200 for valid log ID', async () => {
    const logResponse = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({ entity_type: 'SESSION' });

    const response = await request(app)
      .delete(`/api/log/${logResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('DELETE /api/log/{id} should return 400 for invalid log ID', async () => {
    const response = await request(app)
      .delete('/api/log/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Log with id 'invalidId' not found"
    );
  });
});
