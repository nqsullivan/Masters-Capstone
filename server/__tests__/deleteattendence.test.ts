import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll, afterAll } from '@jest/globals';
import AuthService from '../src/services/auth';
import DatabaseAccess from '../src/services/database';
import { validate as isValidUUID } from 'uuid';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('DELETE /attendance/:attendanceId', () => {
  let token: string;
  let db: DatabaseAccess;

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseAccess.getInstance();

    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');
    await db.runWithNoReturned('DELETE FROM attendance');

    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  afterAll(async () => {
    await db.runWithNoReturned('DELETE FROM attendance');
  });

  test('should delete an existing attendance record and return 204', async () => {
    const classResponse = await request(app)
      .post('/api/class')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SER517 Capstone2' });

    const sessionResponse = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${token}`)
      .send({
        classId: classResponse.body.id,
        startTime: new Date('2025-01-01T10:00:00Z').toISOString(),
        endTime: new Date('2025-01-01T11:00:00Z').toISOString(),
        professorId: 'fakeProfId',
      });

    const studentResponse = await request(app)
      .post('/api/student')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        image: 'path/to/image.jpg',
      });

    const attendanceResponse = await request(app)
      .post(`/api/session/${sessionResponse.body.id}/attendance`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId: studentResponse.body.id,
        checkInTime: '2025-01-01T10:30:00Z',
        portraitUrl: 'www.test.com',
      });

    const attendanceId = attendanceResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/api/attendance/${attendanceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });

  test('should return 404 if attendance record does not exist', async () => {
    const nonExistentAttendanceId = 'non-existent-id';

    const response = await request(app)
      .delete(`/api/attendance/${nonExistentAttendanceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid attendance ID');
  });

  test('should return 400 if attendance ID is invalid', async () => {
    const invalidAttendanceId = 'invalid-id-format';

    const response = await request(app)
      .delete(`/api/attendance/${invalidAttendanceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid attendance ID');
  });
});
