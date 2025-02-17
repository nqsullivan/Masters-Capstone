import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import AuthService from '../src/services/auth';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Student-Session Assignment API', () => {
  let token: string;
  let sessionId: string;
  let classId1: string;
  let studentId1: string;

  beforeAll(async () => {
    await AuthService.init();
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }

    // Create a class
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone' });

    classId1 = classResponse.body.id;
    const sessionResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        classId: classId1,
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T12:00:00Z',
        professorId: 'fakeProfessorId',
      });

    if (sessionResponse.status !== 201) {
      throw new Error('Failed to create session');
    }

    sessionId = sessionResponse.body.id;

    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        class_id: 'class123',
        image: 'path/to/image.jpg',
      });
    studentId1 = studentResponse.body.id;
  });

  test('POST /api/student-session - Add student to session', async () => {
    const response = await request(app)
      .post('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: studentId1,
        sessionId: sessionId,
      });

    expect(response.status).toBe(201);
  });

  test('POST /api/student-session - Add student to session with invalid studentId', async () => {
    const response = await request(app)
      .post('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: 'fakeStudentId',
        sessionId: sessionId,
      });

    expect(response.status).toBe(400);
  });

  test('POST /api/student-session - Add student to session with invalid sessionId', async () => {
    const response = await request(app)
      .post('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: studentId1,
        sessionId: 'fakeSessionId',
      });

    expect(response.status).toBe(400);
  });

  test('DELETE /api/session/:sessionId/students/:studentId - Remove student from session', async () => {
    const response = await request(app)
      .delete(`/api/session/${sessionId}/students/${studentId1}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('DELETE /api/session/:sessionId/students/:studentId - Remove student from session with invalid studentId', async () => {
    const response = await request(app)
      .delete(`/api/session/${sessionId}/students/fakeStudentId`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  test('DELETE /api/session/:sessionId/students/:studentId - Remove student from session with invalid sessionId', async () => {
    const response = await request(app)
      .delete(`/api/session/fakeSessionId/students/${studentId1}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  test('GET /api/session/:sessionId/students - Get all students in a session', async () => {
    await request(app)
      .post('/api/student-session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: studentId1,
        sessionId: sessionId,
      });
    const response2 = await request(app)
      .get(`/api/session/${sessionId}/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response2.status).toBe(200);
    expect(response2.body).toBeInstanceOf(Array);
  });

  test('GET /api/student-session - Get all students in a session with invalid sessionId', async () => {
    const response = await request(app)
      .get(`/api/session/fakeSessionId/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
