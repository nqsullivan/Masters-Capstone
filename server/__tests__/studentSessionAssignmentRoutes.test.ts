import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Student-Session Assignment API', () => {
  let token: string;
  let sessionId: string;

  beforeAll(async () => {
    await AuthService.init();
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }

    const sessionResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        classId: 'fakeClassId',
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T12:00:00Z',
        professorId: 'fakeProfessorId',
      });

    if (sessionResponse.status !== 201) {
      throw new Error('Failed to create session');
    }

    sessionId = sessionResponse.body.id;
  });

  test('POST /api/student-session - Add student to session', async () => {
    const response = await request(app)
      .post('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: 'fakeStudentId',
        sessionId: sessionId,
      });

    expect(response.status).toBe(201);
  });

  test('POST /api/student-session - Add student to session', async () => {
    const response = await request(app)
      .post('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: 'fakeStudentId',
        sessionId: 'sessionId',
      });

    expect(response.status).toBe(400);
  });

  test('DELETE /api/student-session - Remove student from session', async () => {
    const response = await request(app)
      .delete('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: 'fakeStudentId',
        sessionId: sessionId,
      });

    expect(response.status).toBe(200);
  });

  test('DELETE /api/student-session - Remove student from session', async () => {
    const response = await request(app)
      .delete('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: 'fakeStudentId',
        sessionId: 'sessionId',
      });

    expect(response.status).toBe(400);
  });
});
