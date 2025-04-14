import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import DatabaseAccess from '../src/services/database';
import AuthService from '../src/services/auth';
import ClassService from '../src/services/class';
import StudentClassAssignmentService from '../src/services/studentClassAssignment';
import { expect, test, describe, beforeAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Student-Class Assignment API', () => {
  let token: string;
  let db: DatabaseAccess;
  const className = 'SER517 Capstone';
  const roomNumber = 'PRLTA201';
  const mockStartTime = '10:00:00';
  const mockEndTime = '11:15:00';
  let classId: string;

  beforeAll(async () => {
    AuthService.init();
    db = await DatabaseAccess.getInstance();

    // Cleanup existing data
    await db.runWithNoReturned('DELETE FROM student_class_lookup');
    await db.runWithNoReturned('DELETE FROM class');
    await db.runWithNoReturned('DELETE FROM student');
    await db.runWithNoReturned('DELETE FROM user');
    await db.runWithNoReturned('DELETE FROM credential');

    // Create admin user and get token
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }

    // Create a class
    classId = (
      await ClassService.createClass(
        className,
        roomNumber,
        mockStartTime,
        mockEndTime
      )
    ).id;

    // Create students
    await db.runWithNoReturned(
      `INSERT INTO student (id, name) VALUES ('student1', 'Alice')`
    );
    await db.runWithNoReturned(
      `INSERT INTO student (id, name) VALUES ('student2', 'Bob')`
    );
  });

  test('POST /class/:classId/students should assign students to a class', async () => {
    const response = await request(app)
      .post(`/api/class/${classId}/students`)
      .set('Authorization', `Bearer ${token}`)
      .send({ studentIds: ['student1', 'student2'] });

    expect(response.status).toBe(201);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('studentId', 'student1');
    expect(response.body[1]).toHaveProperty('studentId', 'student2');

    const students =
      await StudentClassAssignmentService.getStudentsForClass(classId);
    expect(students.length).toBe(2);
    expect(students).toContainEqual('student1');
    expect(students).toContainEqual('student2');
  });

  test('GET /api/class/:classId/students should return assigned students', async () => {
    StudentClassAssignmentService.addStudentsToClass(
      ['student1', 'student2'],
      classId
    );

    const response = await request(app)
      .get(`/api/class/${classId}/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body).toContainEqual('student1');
    expect(response.body).toContainEqual('student2');
  });

  // Error Handling: Assigning a Non-Existent Student
  test('POST /api/class/:classId/students should return error if student not found', async () => {
    const response = await request(app)
      .post(`/api/class/${classId}/students`)
      .set('Authorization', `Bearer ${token}`)
      .send({ studentIds: ['invalid_student'] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Student with id 'invalid_student' not found"
    );
  });

  // Error Handling: Assigning to a Non-Existent Class
  test('POST /api/class/:classId/students should return error if class not found', async () => {
    const response = await request(app)
      .post(`/api/class/invalid_class/students`)
      .set('Authorization', `Bearer ${token}`)
      .send({ studentIds: ['student1'] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalid_class' not found"
    );
  });

  // Error Handling: Getting Students from a Non-Existent Class
  test('GET /api/class/:classId/students should return error if class not found', async () => {
    const response = await request(app)
      .get(`/api/class/invalid_class/students`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      "Class with id 'invalid_class' not found"
    );
  });

  test('DELETE /api/class/:classId/students/:studentId should remove a student from a class', async () => {
    const response = await request(app)
      .delete(`/api/class/${classId}/student/student1`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Student removed from class successfully'
    );
    const students =
      await StudentClassAssignmentService.getStudentsForClass(classId);

    expect(students.length).toBe(1);
    expect(students).not.toContainEqual('student1');
    expect(students).toContainEqual('student2');
  });
});
