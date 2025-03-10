import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll, beforeEach } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Student API', () => {
  let token: string;
  let db: DatabaseAccess;

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseAccess.getInstance();

    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');

    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  beforeEach(async () => {
    await db.runWithNoReturned('DELETE FROM student');
  });

  test('POST /api/student should create a student successfully', async () => {
    const response = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        image: 'path/to/image.jpg',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('name', 'John Doe');
    expect(response.body).toHaveProperty('image', 'path/to/image.jpg');
  });

  test('POST /api/student should return 404 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Name cannot be empty');
  });

  test('GET /api/student/:id should return student details for a valid student ID', async () => {
    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        image: 'path/to/image.jpg',
      });

    const response = await request(app)
      .get(`/api/student/${studentResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('name', 'John Doe');
    expect(response.body).toHaveProperty('image', 'path/to/image.jpg');
  });

  test('GET /api/student/:id should return 404 for an invalid student ID', async () => {
    const response = await request(app)
      .get('/api/student/invalidId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      'error',
      "Student with id 'invalidId' not found"
    );
  });

  test('PUT /api/student/:id should update student details successfully', async () => {
    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        image: 'path/to/image.jpg',
      });

    const response = await request(app)
      .put(`/api/student/${studentResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jane Doe',
        image: 'path/to/new_image.jpg',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'Jane Doe');
    expect(response.body).toHaveProperty('image', 'path/to/new_image.jpg');
  });

  test('PUT /api/student/:id should return 404 for an invalid student ID', async () => {
    const response = await request(app)
      .put('/api/student/invalidId')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jane Doe',
        image: 'path/to/new_image.jpg',
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      'error',
      "Student with id 'invalidId' not found"
    );
  });

  test('DELETE /api/student/:id should delete a student successfully', async () => {
    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        image: 'path/to/image.jpg',
      });

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
    expect(response.body).toHaveProperty(
      'error',
      "Student with id 'invalidId' not found"
    );
  });

  test('GET /api/students should return 200 and 1 page of 2 students', async () => {
    await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Student1',
      });

    await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Student2',
      });

    const response = await request(app)
      .get(`/api/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalItems', 2);
    expect(response.body).toHaveProperty('totalPages', 1);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('name', 'Student1');
    expect(response.body.data[1]).toHaveProperty('name', 'Student2');
  });

  test('GET /api/students?page=2&size=1 should return 200 and 1 page of 1 singular student', async () => {
    await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Student1',
      });

    await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Student2',
      });

    const response = await request(app)
      .get(`/api/students?page=2&size=1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 2);
    expect(response.body).toHaveProperty('pageSize', 1);
    expect(response.body).toHaveProperty('totalItems', 2);
    expect(response.body).toHaveProperty('totalPages', 2);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('name', 'Student2');
  });
});
