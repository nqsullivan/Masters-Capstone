import TestUtils from './utils';
import request from 'supertest';
import express from 'express';
import routes from '../routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Class API', () => {
  let token: string | null = '';
  beforeAll(async () => {
    token = await TestUtils.getValidToken();
  });

  test('POST /api/class should return 200 for valid request', async () => {
    const response = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('name', 'SER517 Capstone');
  });

  test('POST /api/class should return 400 for empty class name', async () => {
    const response = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Name cannot be empty');
  });

  test('GET /api/class/{id} should return 200 for valid class ID', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    console.log();
    const response = await request(app)
      .get(`/api/class/${classResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'SER517 Capstone');
  });

  test('GET /api/class/{id} should return 400 for invalid class ID', async () => {
    const response = await request(app)
      .get('/api/class/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalidId' not found"
    );
  });

  test('PUT /api/class/{id} should return 200 for valid update', async () => {
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

  test('PUT /api/class/{id} should return 400 for invalid class ID', async () => {
    const response = await request(app)
      .put('/api/class/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalidId' not found"
    );
  });

  test('DELETE /api/class/{id} should return 200 for valid class ID', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    console.log();
    const response = await request(app)
      .delete(`/api/class/${classResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('DELETE /api/class/{id} should return 400 for invalid class ID', async () => {
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
