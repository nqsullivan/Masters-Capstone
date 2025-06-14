import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll, beforeEach } from '@jest/globals';

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

    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  beforeEach(async () => {
    await db.runWithNoReturned('DELETE FROM log');
  });

  test('POST /api/log should return 200 for valid request', async () => {
    const response = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 'admin',
        action: 'LOGIN',
        entityType: 'USER',
        entityId: 'admin',
      });

    expect(response.body).toHaveProperty('action', 'LOGIN');
    expect(response.status).toBe(201);
  });

  test('GET /api/log/{id} should return 200 for valid log ID', async () => {
    const logResponse = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 'admin',
        action: 'SCAN',
        entityType: 'USER',
        entityId: 'admin',
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
        userId: 'admin',
        action: 'LOGIN',
        entityType: 'SESSION',
        entityId: 'admin',
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

  test('GET /api/logs should return 200 and 1 page of 2 logs', async () => {
    await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 'admin',
        action: 'SCAN',
        entityType: 'USER',
        entityId: 'admin',
      });

    await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 'admin',
        action: 'LOGIN',
        entityType: 'USER',
        entityId: 'admin',
      });

    const response = await request(app)
      .get(`/api/logs`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalItems', 2);
    expect(response.body).toHaveProperty('totalPages', 1);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('action', 'SCAN');
    expect(response.body.data[1]).toHaveProperty('action', 'LOGIN');
  });

  test('GET /api/logs?page=2&size=1 should return 200 and 1 page of 1 singular log', async () => {
    await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 'admin',
        action: 'SCAN',
        entityType: 'USER',
        entityId: 'admin',
      });

    await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 'admin',
        action: 'LOGIN',
        entityType: 'USER',
        entityId: 'admin',
      });

    const response = await request(app)
      .get(`/api/logs?page=2&size=1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 2);
    expect(response.body).toHaveProperty('pageSize', 1);
    expect(response.body).toHaveProperty('totalItems', 2);
    expect(response.body).toHaveProperty('totalPages', 2);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('action', 'LOGIN');
  });
});
