import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Student API', () => {
  let token: string;
  let db: DatabaseAccess;

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseAccess.getInstance();

    await db.runWithNoReturned('DELETE FROM student');
    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');

    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  test('POST /api/student should create a student successfully', async () => {
    const response = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Doe', class_id: 'class123', image: 'path/to/image.jpg' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('name', 'John Doe');
    expect(response.body).toHaveProperty('class_id', 'class123');
    expect(response.body).toHaveProperty('image', 'path/to/image.jpg');
  });

  test('POST /api/student should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Name and class_id cannot be empty');
  });

  test('GET /api/student/:id should return student details for a valid student ID', async () => {
    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Doe', class_id: 'class123', image: 'path/to/image.jpg' });

    const response = await request(app)
      .get(`/api/student/${studentResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'John Doe');
    expect(response.body).toHaveProperty('class_id', 'class123');
    expect(response.body).toHaveProperty('image', 'path/to/image.jpg');
  });

  test('GET /api/student/:id should return 404 for an invalid student ID', async () => {
    const response = await request(app)
      .get('/api/student/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', "Student with id 'invalidId' not found");
  });

  test('PUT /api/student/:id should update student details successfully', async () => {
    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Doe', class_id: 'class123', image: 'path/to/image.jpg' });

    const response = await request(app)
      .put(`/api/student/${studentResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jane Doe', class_id: 'class456', image: 'path/to/new_image.jpg' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'Jane Doe');
    expect(response.body).toHaveProperty('class_id', 'class456');
    expect(response.body).toHaveProperty('image', 'path/to/new_image.jpg');
  });

  test('PUT /api/student/:id should return 404 for an invalid student ID', async () => {
    const response = await request(app)
      .put('/api/student/invalidId')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jane Doe', class_id: 'class456', image: 'path/to/new_image.jpg' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', "Student with id 'invalidId' not found");
  });

  test('DELETE /api/student/:id should delete a student successfully', async () => {
    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Doe', class_id: 'class123', image: 'path/to/image.jpg' });

    const response = await request(app)
      .delete(`/api/student/${studentResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.text).toBe(`Deleted student ${studentResponse.body.id}`);
  });

  test('DELETE /api/student/:id should return 404 for an invalid student ID', async () => {
    const response = await request(app)
      .delete('/api/student/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', "Student with id 'invalidId' not found");
  });
});