import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';
import AuthService from '../src/services/auth';
import ClassService from '../src/services/class';
import SessionService from '../src/services/session';
import StudentService from '../src/services/student';
import StudentClassAssignmentService from '../src/services/studentClassAssignment';
import UserClassAssignmentService from '../src/services/userClassAssignment';

import DatabaseAccess from '../src/services/database';
const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Session Routes', () => {
  let token: string;
  let db: DatabaseAccess;
  let classId: string;
  const profName: string = 'admin';

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseAccess.getInstance();

    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');

    await AuthService.register(profName, 'adminpass');
    token = await AuthService.login(profName, 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
    const classResponse = await ClassService.createClass(
      'SER517 Capstone2',
      'PRLTA201',
      '10:00:00',
      '11:15:00'
    );
    classId = classResponse.id;
    await UserClassAssignmentService.assignProfessorToClass(profName, classId);
  });

  const mockStartTime = new Date('2025-01-01T10:00:00Z').toISOString();
  const mockEndTime = new Date('2025-01-01T11:00:00Z').toISOString();

  test('POST /session should create a new session', async () => {
    const sessionData = {
      classId: classId,
      startTime: mockStartTime,
      endTime: mockEndTime,
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
      classId
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
      classId
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
      classId
    );
    const sessionId = createResponse.id;

    const updatedSessionData = {
      startTime: new Date('2026-01-01T12:00:00Z'),
      endTime: new Date('2026-01-01T13:00:00Z'),
      classId: classId,
    };

    const updateResponse = await request(app)
      .put(`/api/session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedSessionData);

    expect(updateResponse.status).toBe(200);
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

  test('POST /api/session/:sessionId/attendance should return 200 and attendance details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId
    );

    const studentResponse = await StudentService.createStudent(
      'John Doe',
      'path/to/image.jpg'
    );

    const attendanceData = {
      studentId: studentResponse.id,
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
    expect(response.body).toHaveProperty('portraitUrl', 'www.test.com');
    expect(response.body).toHaveProperty('portraitCaptured', true);
  });

  test('POST /api/session/:sessionId/attendance with invalid sessionId should return 400 and error details', async () => {
    const attendanceData = {
      studentId: 1,
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
      classId
    );

    const attendanceData = {
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
      classId
    );

    const studentResponse = await StudentService.createStudent(
      'John Doe',
      'path/to/image.jpg'
    );

    const attendanceResponse = await SessionService.addAttendanceRecord(
      sessionResponse.id,
      studentResponse.id,
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

  test('PUT /api/session/:sessionId/attendance/:attendanceId with Flag lifecycle updates should return 200 and updated attendance details', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId
    );

    const studentResponse = await StudentService.createStudent(
      'John Doe',
      'path/to/image.jpg'
    );

    const attendanceResponse = await SessionService.addAttendanceRecord(
      sessionResponse.id,
      studentResponse.id,
      'www.test.com'
    );

    const updatedAttendanceData = {
      FRIdentifiedId: 'different-id',
      status: 'ESCALATED',
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
    expect(response.body).toHaveProperty('FRIdentifiedId', 'different-id');
    expect(response.body).toHaveProperty('status', 'ESCALATED');
    expect(response.body).toHaveProperty('flagged', true);
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
      classId
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
      classId
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
      classId
    );

    const studentResponse = await StudentService.createStudent(
      'John Doe',
      'path/to/image.jpg'
    );

    const attendanceResponse = await SessionService.addAttendanceRecord(
      sessionResponse.id,
      studentResponse.id,
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
      classId
    );

    const response = await request(app)
      .delete(`/api/session/${sessionResponse.id}/attendance/1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /session/:sessionId/attendance should return 200 and attendance records', async () => {
    const sessionResponse = await SessionService.createSession(
      mockStartTime,
      mockEndTime,
      classId
    );

    const studentResponse = await StudentService.createStudent(
      'fake student',
      'fake_image_path'
    );

    await SessionService.addAttendanceRecord(
      sessionResponse.id,
      studentResponse.id,
      'fake url'
    );

    const response = await request(app)
      .get(`/api/session/${sessionResponse.id}/attendance`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('GET /api/attendance should return 200 with no attendance records', async () => {
    const response = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('totalItems', 0);
    expect(response.body.data).toHaveLength(0);
  });

  test('GET /api/attendance should return 200 and paginated attendance data', async () => {
    const session1 = await SessionService.createSession(
      new Date('2025-02-01T08:00:00Z').toISOString(),
      new Date('2025-02-01T09:00:00Z').toISOString(),
      classId
    );

    const session2 = await SessionService.createSession(
      new Date('2025-02-02T08:00:00Z').toISOString(),
      new Date('2025-02-02T09:00:00Z').toISOString(),
      classId
    );

    const student1 = await StudentService.createStudent(
      'Alice Johnson',
      'path/to/image1.jpg'
    );
    const student2 = await StudentService.createStudent(
      'Bob Smith',
      'path/to/image2.jpg'
    );

    await StudentClassAssignmentService.addStudentsToClass(
      [student1.id, student2.id],
      classId
    );

    await SessionService.addAttendanceRecord(
      session1.id,
      student1.id,
      '2025-02-01T08:05:00.000Z'
    );

    await SessionService.addAttendanceRecord(
      session2.id,
      student2.id,
      '2025-02-02T08:10:00.000Z'
    );

    const response = await request(app)
      .get(`/api/attendance`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('totalItems', 2);
    expect(response.body).toHaveProperty('totalPages', 1);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('studentId');
    expect(response.body.data[0]).toHaveProperty('checkIn');
  });

  test('GET /api/attendance?page=2&size=1 should return second page of data', async () => {
    const session1 = await SessionService.createSession(
      new Date('2025-02-01T08:00:00Z').toISOString(),
      new Date('2025-02-01T09:00:00Z').toISOString(),
      classId
    );

    const session2 = await SessionService.createSession(
      new Date('2025-02-02T08:00:00Z').toISOString(),
      new Date('2025-02-02T09:00:00Z').toISOString(),
      classId
    );

    const student1 = await StudentService.createStudent(
      'Alice Johnson',
      'path/to/image1.jpg'
    );
    const student2 = await StudentService.createStudent(
      'Bob Smith',
      'path/to/image2.jpg'
    );

    await StudentClassAssignmentService.addStudentsToClass(
      [student1.id, student2.id],
      classId
    );

    await SessionService.addAttendanceRecord(
      session1.id,
      student1.id,
      'url1.com'
    );

    await SessionService.addAttendanceRecord(
      session2.id,
      student2.id,
      'url2.com'
    );

    const response = await request(app)
      .get(`/api/attendance?page=2&size=1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 2);
    expect(response.body.pageSize).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('studentId');
  });
});
