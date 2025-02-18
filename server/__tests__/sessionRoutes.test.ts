/** 
import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';
import AuthService from '../src/services/auth';
import { createSession, deleteSession, getSession, updateSession, getStudentsForSession } from '../src/controllers/session';
import SessionService from '../src/services/session';

const app = express();
app.use(express.json());
app.use('/api', routes);

jest.mock('../src/services/session');

describe('Session Routes and Controller', () => {
  let token: string;

  beforeAll(async () => {
    await AuthService.init();
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockStartTime = new Date('2025-01-01T10:00:00Z').toISOString();
  const mockEndTime = new Date('2025-01-01T11:00:00Z').toISOString();

  test('GET /session/:id should return a session by id', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone3' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };
    console.log('sessionData: ', sessionData);
    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;
    console.log('sessionId: ', sessionId);

    const getResponse = await request(app)
      .get(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty('id', sessionId);
  });


  test('POST /session should return 400 if startTime is missing', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const response = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    expect(response.status).toBe(201);
  });

  test('PUT /session/:id should return 400 if startTime is missing', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const updatedSessionData = {
      endTime: new Date('2026-01-01T13:00:00Z'),
      classId: classResponse.body.id,
      professorId: 'fakeProfId',
    };

    const response = await request(app)
      .put(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(response.status).toBe(404);
  });

  test('PUT /session/:id should return 400 if endTime is missing', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const updatedSessionData = {
      startTime: new Date('2026-01-01T12:00:00Z'),
      classId: classResponse.body.id,
      professorId: 'fakeProfId',
    };

    const response = await request(app)
      .put(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(response.status).toBe(404);
  });

  test('PUT /session/:id should return 400 if classId is missing', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const updatedSessionData = {
      startTime: new Date('2026-01-01T12:00:00Z'),
      endTime: new Date('2026-01-01T13:00:00Z'),
      professorId: 'fakeProfId',
    };

    const response = await request(app)
      .put(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(response.status).toBe(404);
  });

  test('PUT /session/:id should return 400 if professorId is missing', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const updatedSessionData = {
      startTime: new Date('2026-01-01T12:00:00Z'),
      endTime: new Date('2026-01-01T13:00:00Z'),
      classId: classResponse.body.id,
    };

    const response = await request(app)
      .put(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(response.status).toBe(404);
  });

  test('createSession should return 400 if an error occurs', async () => {
    (SessionService.createSession as jest.Mock).mockRejectedValue(new Error('Create session error'));

    const response = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        classId: 'classId',
        professorId: 'professorId'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Create session error');
  });

  test('deleteSession should return 204 if session is deleted', async () => {
    (SessionService.deleteSession as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete('/api/session/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  test('deleteSession should return 400 if an error occurs', async () => {
    (SessionService.deleteSession as jest.Mock).mockRejectedValue(new Error('Delete session error'));

    const response = await request(app)
      .delete('/api/session/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Delete session error');
  });

  test('getSession should return 404 if session not found', async () => {

    const response = await request(app)
      .get('/api/session/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Session not found');
  });

  test('getSession should return 400 if an error occurs', async () => {
    (SessionService.getSession as jest.Mock).mockRejectedValue(new Error('Get session error'));

    const response = await request(app)
      .get('/api/session/1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Get session error');
  });

  test('updateSession should return 404 if session not found', async () => {

    const response = await request(app)
      .put('/api/session/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        classId: 'classId',
        professorId: 'professorId'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Session not found');
  });

  test('updateSession should return 400 if an error occurs', async () => {
    (SessionService.updateSession as jest.Mock).mockRejectedValue(new Error('Update session error'));

    const response = await request(app)
      .put('/api/session/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        classId: 'classId',
        professorId: 'professorId'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Update session error');
  });

  test('getStudentsForSession should return 404 if no students found', async () => {
    (SessionService.getStudentsForSession as jest.Mock).mockRejectedValue(new Error('No students found for this session'));

    const response = await request(app)
      .get('/api/session/1/students')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No students found for this session');
  });

  test('getStudentsForSession should return 400 if an error occurs', async () => {
    (SessionService.getStudentsForSession as jest.Mock).mockRejectedValue(new Error('Get students error'));

    const response = await request(app)
      .get('/api/session/1/students')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Get students error');
  });
});


**/
import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';
import AuthService from '../src/services/auth';
import SessionService from '../src/services/session';
const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Session Routes', () => {
  let token: string;
  beforeAll(async () => {
    await AuthService.init();
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  const mockStartTime = new Date('2025-01-01T10:00:00Z').toISOString();
  const mockEndTime = new Date('2025-01-01T11:00:00Z').toISOString();

  test('POST /session should create a new session', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const response = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('DELETE /session/:id should delete a session', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });

  test('DELETE /session/:id should return 404 if session does not exist', async () => {
    const SessionId = 'fakeSessionId';

    const response = await request(app)
      .delete(`/api/session/${SessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  test('GET /session/:id should return a session by id', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone3' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const getResponse = await request(app)
      .get(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty('id', sessionId);
  });

  test('PUT /session/:id should update a session', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const updatedSessionData = {
      startTime: new Date('2026-01-01T12:00:00Z'),
      endTime: new Date('2026-01-01T13:00:00Z'),
      classId: classResponse.body.id,
      professorId: 'fakeProfId',
    };

    const updateResponse = await request(app)
      .put(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(updateResponse.status).toBe(200);
  });

  test('GET /session/:sessionId/students should return students for a session', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone4' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const response1 = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe1',
        image: 'path/to/image.jpg',
      });
    const response2 = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe2',
        image: 'path/to/image.jpg',
      });
    const studentId1 = response1.body.id;
    const studentId2 = response2.body.id;

    const postResponse = await request(app)
      .post(`/api/session/${sessionId}/students`)
      .set('Authorization', `Bearer ${token}`)
      .send({ studentIds: [studentId1, studentId2] });

    expect(postResponse.status).toBe(201);

    const getResponse = await request(app)
      .get(`/api/session/${sessionId}/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual([studentId1, studentId2]);
  });

  test('POST /session should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test('PUT /session/:id should return 404 if session does not exist', async () => {
    const updatedSessionData = {
      startTime: new Date('2026-01-01T12:00:00Z'),
      endTime: new Date('2026-01-01T13:00:00Z'),
      classId: 'fakeClassId',
      professorId: 'fakeProfId',
    };

    const response = await request(app)
      .put('/api/session/fakeSessionId')
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(response.status).toBe(404);
  });

  test('GET /session/:id should return 404 if session does not exist', async () => {
    const response = await request(app)
      .get('/api/session/fakeSessionId')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  test('GET /session/:sessionId/students should return 404 if no students found', async () => {
    const response = await request(app)
      .get('/api/session/fakeSessionId/students')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  test('createSession should return 400 if an error occurs', async () => {
    const response = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startTime: new Date(),
        endTime: new Date().toISOString(),
        classId: 'classId',
        professorId: 'professorId',
      });

    expect(response.status).toBe(400);
  });

  test('GET /session/:sessionId/students should return 404 if no students found', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone5' });

    const sessionData = {
      classId: classResponse.body.id,
      startTime: mockStartTime,
      endTime: mockEndTime,
      professorId: 'fakeProfId',
    };

    const createResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    const sessionId = createResponse.body.id;

    const response = await request(app)
      .get(`/api/session/${sessionId}/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No students found for this session');
  });
});
