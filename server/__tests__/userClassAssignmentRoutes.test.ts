import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('User-Class Assignment API', () => {
  let token: string;
  let db: DatabaseAccess;
  const professor_username = 'professor1';
  const professor_password = 'password';
  let class_id: string;

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseAccess.getInstance();

    await db.runWithNoReturned('DELETE FROM professor_class_lookup');
    await db.runWithNoReturned('DELETE FROM class');
    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');

    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }

    await request(app)
      .post('/api/register')
      .send({ username: professor_username, password: professor_password });

    const professorResult = await db.runAndReadAll(
      `SELECT id FROM user WHERE username = ?`,
      [professor_username]
    );

    if (!professorResult || professorResult.length === 0) {
      throw new Error('Failed to create professor user');
    }

    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    class_id = classResponse.body.id;
  });

  test('POST /api/class/assign should assign a professor to a class', async () => {
    const response = await request(app)
      .post('/api/class/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: professor_username, class_id });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('username', professor_username);
    expect(response.body).toHaveProperty('class_id', class_id);
  });

  test('GET /api/class/:classId/professors should return assigned professors', async () => {
    await request(app)
      .post('/api/class/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: professor_username, class_id });

    const response = await request(app)
      .get(`/api/class/${class_id}/professors`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('username', professor_username);
  });

  test('GET /api/class/:classId/professors should return an error if class not found', async () => {
    const response = await request(app)
      .get(`/api/class/invalid_class_id/professors`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty(
      'error',
      'Class with id \'invalid_class_id\' not found'
    );
  });

  test('GET /api/professor/:username/classes should return assigned classes', async () => {
    await request(app)
      .post('/api/class/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: professor_username, class_id });

    const response = await request(app)
      .get(`/api/professor/${professor_username}/classes`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('class_id', class_id);
  });

  test('POST /api/class/unassign should unassign a professor from a class', async () => {
    const response = await request(app)
      .post('/api/class/unassign')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: professor_username, class_id });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Professor unassigned from class'
    );
  });

  test('GET /api/class/:classId/professors should return empty after unassigning', async () => {
    const response = await request(app)
      .get(`/api/class/${class_id}/professors`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(0);
  });
});
