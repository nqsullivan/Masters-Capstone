import request from 'supertest';
import express from 'express';
import { getDashboardData } from '../src/controllers/dashboard';
import { DashboardData } from '../src/models/dashboardData';
import { describe, test, expect, beforeAll } from '@jest/globals';
import ClassService from '../src/services/class';
import UserService from '../src/services/user';
import StudentService from '../src/services/student';
import SessionService from '../src/services/session';
import StudentClassAssignmentService from '../src/services/studentClassAssignment';
import UserClassAssignmentService from '../src/services/userClassAssignment';

const app = express();
app.use(express.json());
app.use('/api/dashboard/:classId', getDashboardData);

describe('Dashboard API', () => {
  let testResults: DashboardData;
  let classId: string = '';
  let sessionId: string = '';
  let studentId1: string = '';
  let studentId2: string = '';

  beforeAll(async () => {
    let classResult = await ClassService.createClass(
      'Test Class',
      'PRLTA201',
      '10:00:00',
      '11:15:00'
    );
    classId = classResult.id;
    let professor1 = await UserService.insertUser({
      username: 'professor1',
      type: 'professor',
    });
    let professor2 = await UserService.insertUser({
      username: 'professor2',
      type: 'professor',
    });
    await UserClassAssignmentService.assignProfessorToClass(
      professor1.username,
      classId
    );
    await UserClassAssignmentService.assignProfessorToClass(
      professor2.username,
      classId
    );
    let student1 = await StudentService.createStudent('Alice', 'alice.jpg');
    let student2 = await StudentService.createStudent('Bob', 'bob.jpg');
    studentId1 = student1.id;
    studentId2 = student2.id;
    await StudentClassAssignmentService.addStudentsToClass(
      [studentId1, studentId2],
      classId
    );
    let session1 = await SessionService.createSession(
      new Date().toISOString().split('.')[0] + 'Z',
      new Date().toISOString().split('.')[0] + 'Z',
      classId
    );
    sessionId = session1.id;
    let attendance1 = await SessionService.addAttendanceRecord(
      sessionId,
      studentId1,
      'portrait.jpg'
    );
    let attendance2 = await SessionService.addAttendanceRecord(
      sessionId,
      studentId2,
      'portrait.jpg'
    );

    testResults = {
      class: classResult,
      professors: [professor1.username, professor2.username],
      students: [student1, student2],
      sessions: [
        {
          ...session1,
          startTime: formatDateToSQL(session1.startTime),
          endTime: formatDateToSQL(session1.endTime),
        },
      ],
      attendance: {
        [session1.id]: [
          {
            ...attendance1,
            checkIn: ""
          },
          {
            ...attendance2,
            checkIn: ""
          },
        ],
      },
    };
  });

  test('GET /api/dashboard/:classId should return dashboard data', async () => {
    const response = await request(app).get(`/api/dashboard/${classId}`);
    expect(response.body).toEqual(testResults);
  });

  test('GET /api/dashboard/:classId should return 400 if class is invalid', async () => {
    const response = await request(app).get('/api/dashboard/invalid-class');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalid-class' not found"
    );
  });
});

function formatDateToSQL(dateString: string): string {
  return dateString.replace('T', ' ').replace('Z', '');
}
