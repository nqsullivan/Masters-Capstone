import DatabaseAccess from '../services/database.ts';
import { StudentSessionAssignment } from '../models/studentSessionAssignment.ts';

/**
 export interface StudentSessionAssignment {
    studentId: string;
    sessionId: string;
}
 */

class StudentSessionAssignmentService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async addStudentToSession(
    studentId: string,
    sessionId: string
  ): Promise<StudentSessionAssignment> {
    /*const student = await this.db.runAndReadAll(
            `SELECT id FROM student WHERE id = ?`,
            [studentId]
        );
        if (student.length === 0) {
            throw new Error(`Student with id '${studentId}' not found`);
        }*/

    const session = await this.db.runAndReadAll(
      `SELECT id FROM session WHERE id = ?`,
      [sessionId]
    );
    if (session.length === 0) {
      throw new Error(`Session with id '${sessionId}' not found`);
    }

    const existingAssignment = await this.db.runAndReadAll(
      `SELECT student_id, session_id FROM student_session_lookup WHERE student_id = ? AND session_id = ?`,
      [studentId, sessionId]
    );
    if (existingAssignment.length > 0) {
      throw new Error(
        `Student with id '${studentId}' is already assigned to session with id '${sessionId}'`
      );
    }

    await this.db.runWithNoReturned(
      `INSERT INTO student_session_lookup (student_id, session_id) VALUES (?, ?)`,
      [studentId, sessionId]
    );

    return { studentId, sessionId };
  }

  async deleteStudentFromSession(
    studentId: string,
    sessionId: string
  ): Promise<void> {
    const existingAssignment = await this.db.runAndReadAll(
      `SELECT student_id, session_id FROM student_session_lookup WHERE student_id = ? AND session_id = ?`,
      [studentId, sessionId]
    );
    if (existingAssignment.length === 0) {
      throw new Error(
        `No assignment found for student with id '${studentId}' and session with id '${sessionId}'`
      );
    }

    await this.db.runWithNoReturned(
      `DELETE FROM student_session_lookup WHERE student_id = ? AND session_id = ?`,
      [studentId, sessionId]
    );
  }
}

export default new StudentSessionAssignmentService();
