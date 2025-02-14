import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Log API', () => {
  let token: string;
  let db: DatabaseAccess;

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseAccess.getInstance();

    await db.runWithNoReturned('DELETE FROM class');
    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');
    await db.runWithNoReturned('DELETE FROM log');

    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  test('POST /api/log should return 200 for valid request', async () => {
    const response = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: 'admin',
        action: 'LOGIN',
        entity_type: 'USER',
        entity_id: 'admin',
      });

    expect(response.body).toHaveProperty('action', 'LOGIN');
    expect(response.status).toBe(201);
  });

  test('GET /api/log/{id} should return 200 for valid log ID', async () => {
    const logResponse = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: 'admin',
        action: 'SCAN',
        entity_type: 'USER',
        entity_id: 'admin',
      });

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
      .send({
        user_id: 'admin',
        action: 'LOGIN',
        entity_type: 'SESSION',
        entity_id: 'admin',
      });

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
