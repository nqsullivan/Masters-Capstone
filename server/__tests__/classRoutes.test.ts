import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseSAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Class API', () => {
  let token: string;
  let db: DatabaseSAccess;

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseSAccess.getInstance();

    await db.runWithNoReturned('DELETE FROM class');
    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credentials');

    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  test('POST /api/class should create a class successfully', async () => {
    const response = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('name', 'SER517 Capstone');
  });

  test('POST /api/class should return 400 for an empty class name', async () => {
    const response = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Name cannot be empty');
  });

  test('GET /api/class/:id should return class details for a valid class ID', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    const response = await request(app)
      .get(`/api/class/${classResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'SER517 Capstone');
  });

  test('GET /api/class/:id should return 400 for an invalid class ID', async () => {
    const response = await request(app)
      .get('/api/class/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalidId' not found"
    );
  });

  test('PUT /api/class/:id should update class name successfully', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    const response = await request(app)
      .put(`/api/class/${classResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER540 Embedded' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'SER540 Embedded');
  });

  test('PUT /api/class/:id should return 400 for an invalid class ID', async () => {
    const response = await request(app)
      .put('/api/class/invalidId')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER540 Embedded' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalidId' not found"
    );
  });

  test('DELETE /api/class/:id should delete a class successfully', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    const response = await request(app)
      .delete(`/api/class/${classResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('DELETE /api/class/:id should return 400 for an invalid class ID', async () => {
    const response = await request(app)
      .delete('/api/class/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalidId' not found"
    );
  });
});
