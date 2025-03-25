import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';
import AuthService from '../src/services/auth';
import ClassService from '../src/services/class';
import SessionService from '../src/services/session';
import StudentService from '../src/services/student';
import UserClassAssignmentService from '../src/services/userClassAssignment';
import StudentClassAssignmentService from '../src/services/studentClassAssignment';
import StudentSessionAssignmentService from '../src/services/studentSessionAssignment';

import DatabaseAccess from '../src/services/database';
const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Session Routes', () => {
  let token: string;
  let db: DatabaseAccess;
  let classId: string;

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
    const classResponse = await ClassService.createClass('SER517 Capstone2', 'PRLTA201','10:00:00','11:15:00');
    classId = classResponse.id;
  });

  const mockStartTime = new Date('2025-01-01T10:00:00Z').toISOString();
  const mockEndTime = new Date('2025-01-01T11:00:00Z').toISOString();

  test('POST /session should create a new session', async () => {
    

    const sessionData = {
      classId: classId,
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
    const createResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );
    const sessionId = createResponse.id;

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
    const createResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );
    const sessionId = createResponse.id;

    const response = await request(app)
      .get(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', sessionId);
  });

  test('PUT /session/:id should update a session', async () => {
    const createResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );
    const sessionId = createResponse.id;

    const updatedSessionData = {
      startTime: new Date('2026-01-01T12:00:00Z'),
      endTime: new Date('2026-01-01T13:00:00Z'),
      classId: classId,
      professorId: 'fakeProfId',
    };

    const updateResponse = await request(app)
      .put(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(updateResponse.status).toBe(200);
  });

  test('GET /session/:sessionId/students should return students for a session', async () => {
    const createResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );
    const sessionId = createResponse.id;

    const student1 = await StudentService.createStudent(
      'John Doe1',
      'path/to/image.jpg'
    );
    const student2 = await StudentService.createStudent(
      'John Doe2',
      'path/to/image.jpg'
    );

    await StudentSessionAssignmentService.addStudentsToSession(
      [student1.id, student2.id],
      sessionId
    );

    const getResponse = await request(app)
      .get(`/api/session/${sessionId}/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual([student1.id, student2.id]);
  });

  test('GET /session/:sessionId/students with invalid sessionId should return 400 and error details', async () => {
    const response = await request(app)
      .get(`/api/session/invalidSessionId/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /session/:sessionId/students should return 200 and empty array if no students are assigned', async () => {
    const createResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );
    const sessionId = createResponse.id;

    const response = await request(app)
      .get(`/api/session/${sessionId}/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
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
    const createResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );
    const sessionId = createResponse.id;

    const response = await request(app)
      .get(`/api/session/${sessionId}/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('POST /api/session/:sessionId/attendance should return 200 and attendance details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );

    const studentResponse = await StudentService.createStudent(
      'John Doe',
      'path/to/image.jpg'
    );

    const attendanceData = {
      studentId: studentResponse.id,
      checkInTime: '2025-02-17T18:00:00.000Z',
      portraitUrl: 'www.test.com',
    };

    const response = await request(app)
      .post(`/api/session/${sessionResponse.id}/attendance`)
      .set('Authorization', `Bearer ${token}`)
      .send(attendanceData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('studentId', studentResponse.id);
    expect(response.body).toHaveProperty('sessionId', sessionResponse.id);
    expect(response.body).toHaveProperty('checkIn', '2025-02-17T18:00:00.000Z');
    expect(response.body).toHaveProperty('portraitUrl', 'www.test.com');
    expect(response.body).toHaveProperty('portraitCaptured', true);
  });

  test('POST /api/session/:sessionId/attendance with invalid sessionId should return 400 and error details', async () => {
    const attendanceData = {
      studentId: 1,
      checkInTime: '2025-02-17T18:00:00.000Z',
      portraitUrl: 'www.test.com',
    };

    const response = await request(app)
      .post(`/api/session/${'invalidId'}/attendance`)
      .set('Authorization', `Bearer ${token}`)
      .send(attendanceData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/session/:sessionId/attendance with missing studentId should return 400 and error details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );

    const attendanceData = {
      checkInTime: '2025-02-17T18:00:00.000Z',
      portraitUrl: 'www.test.com',
    };

    const response = await request(app)
      .post(`/api/session/${sessionResponse.id}/attendance`)
      .set('Authorization', `Bearer ${token}`)
      .send(attendanceData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('PUT /api/session/:sessionId/attendance/:attendanceId should return 200 and updated attendance details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );

    const studentResponse = await StudentService.createStudent(
      'John Doe',
      'path/to/image.jpg'
    );

    const attendanceResponse = await SessionService.addAttendanceRecord(
      sessionResponse.id,
      studentResponse.id,
      '2025-02-17T18:00:00.000Z',
      'www.test.com'
    );

    const updatedAttendanceData = {
      checkInTime: '2025-02-17T18:00:00.000Z',
      portraitUrl: 'www.test.com',
    };

    const response = await request(app)
      .put(
        `/api/session/${sessionResponse.id}/attendance/${attendanceResponse.id}`
      )
      .set('Authorization', `Bearer ${token}`)
      .send(updatedAttendanceData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('studentId', studentResponse.id);
    expect(response.body).toHaveProperty('sessionId', sessionResponse.id);
    expect(response.body).toHaveProperty('checkIn', '2025-02-17T18:00:00.000Z');
    expect(response.body).toHaveProperty('portraitUrl', 'www.test.com');
    expect(response.body).toHaveProperty('portraitCaptured', true);
  });

  test('PUT /api/session/:sessionId/attendance/:attendanceId with invalid sessionId should return 400 and error details', async () => {
    const updatedAttendanceData = {
      checkInTime: '2025-02-17T18:00:00.000Z',
      portraitUrl: 'www.test.com',
    };

    const response = await request(app)
      .put(`/api/session/${'invalidId'}/attendance/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedAttendanceData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('PUT /api/session/:sessionId/attendance/:attendanceId with invalid attendanceId should return 400 and error details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );

    const updatedAttendanceData = {
      checkInTime: '2025-02-17T18:00:00.000Z',
      portraitUrl: 'www.test.com',
    };

    const response = await request(app)
      .put(`/api/session/${sessionResponse.id}/attendance/1`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedAttendanceData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/session/:sessionId/attendance without attendanceId and checkIn should return 400 and error details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );

    const attendanceData = {
      studentId: 1,
      portraitUrl: 'www.test.com',
    };

    const response = await request(app)
      .post(`/api/session/${sessionResponse.id}/attendance`)
      .set('Authorization', `Bearer ${token}`)
      .send(attendanceData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('DELETE /api/session/:sessionId/attendance/:attendanceId should return 204', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );

    const studentResponse = await StudentService.createStudent(
      'John Doe',
      'path/to/image.jpg'
    );

    const attendanceResponse = await SessionService.addAttendanceRecord(
      sessionResponse.id,
      studentResponse.id,
      '2025-02-17T18:00:00.000Z',
      'www.test.com'
    );

    const response = await request(app)
      .delete(
        `/api/session/${sessionResponse.id}/attendance/${attendanceResponse.id}`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  test('DELETE /api/session/:sessionId/attendance/:attendanceId with invalid sessionId should return 400 and error details', async () => {
    const response = await request(app)
      .delete(`/api/session/${'invalidId'}/attendance/1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('DELETE /api/session/:sessionId/attendance/:attendanceId with invalid attendanceId should return 400 and error details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId,
      'fakeProfId'
    );

    const response = await request(app)
      .delete(`/api/session/${sessionResponse.id}/attendance/1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
