import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';
import TestUtils from './utils';
import AuthService from '../src/services/auth';
import DatabaseAccess from '../src/services/database';
import exp from 'constants';

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
    // Create a class
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
    // Create a class
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    // create a session
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

    // delete the created session
    const deleteResponse = await request(app)
      .delete(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });

  // Failure scenario: delete a session that does not exist
  test('DELETE /session/:id should return 404 if session does not exist', async () => {
    const SessionId = 'fakeSessionId';

    const response = await request(app)
      .delete(`/api/session/${SessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  test('GET /session/:id should return a session by id', async () => {
    // Create a class
    const classResponse = await request(app)
        .post('/api/class')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'SER517 Capstone3' });

    // Create a session
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

    // Get the created session
    const getResponse = await request(app)
        .get(`/api/session/${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty('id', sessionId);
});

test('PUT /session/:id should update a session', async () => {
    // Create a class
    const classResponse = await request(app)
        .post('/api/class')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'SER517 Capstone2' });

    // Create a session
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

    // Update the created session  [startTime, endTime, classId, professorId, sessionId]
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

});

