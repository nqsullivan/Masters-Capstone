import DatabaseAccess from './database.js';
import { StudentSessionAssignment } from '../models/studentSessionAssignment.js';

class StudentSessionAssignmentService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async addStudentsToSession(
    studentIds: string[],
    sessionId: string
  ): Promise<StudentSessionAssignment[]> {
    const session = await this.db.runAndReadAll(
      `SELECT id FROM session WHERE id = ?`,
      [sessionId]
    );
    if (session.length === 0) {
      throw new Error(`Session with id '${sessionId}' not found`);
    }

    const assignments: StudentSessionAssignment[] = [];
    for (const studentId of studentIds) {
      const student = await this.db.runAndReadAll(
        `SELECT id FROM student WHERE id = ?`,
        [studentId]
      );
      if (student.length === 0) {
        throw new Error(`Student with id '${studentId}' not found`);
      }

      const existingAssignment = await this.db.runAndReadAll(
        `SELECT studentId, sessionId FROM student_session_lookup WHERE studentId = ? AND sessionId = ?`,
        [studentId, sessionId]
      );
      if (existingAssignment.length == 0) {
        await this.db.runWithNoReturned(
          `INSERT INTO student_session_lookup (studentId, sessionId) VALUES (?, ?)`,
          [studentId, sessionId]
        );
      }

      assignments.push({ studentId, sessionId });
    }

    return assignments;
  }

  async deleteStudentFromSession(
    studentId: string,
    sessionId: string
  ): Promise<void> {
    const existingAssignment = await this.db.runAndReadAll(
      `SELECT studentId, sessionId FROM student_session_lookup WHERE studentId = ? AND sessionId = ?`,
      [studentId, sessionId]
    );
    if (existingAssignment.length === 0) {
      throw new Error(
        `No assignment found for student with id '${studentId}' and session with id '${sessionId}'`
      );
    }

    await this.db.runWithNoReturned(
      `DELETE FROM student_session_lookup WHERE studentId = ? AND sessionId = ?`,
      [studentId, sessionId]
    );
  }
}

export default new StudentSessionAssignmentService();
