import DatabaseAccess from './database.js';
import { StudentSessionAssignment } from '../models/studentSessionAssignment.js';
import SessionService from './session.js';
import StudentService from './student.js';

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
    const session = await SessionService.getSession(sessionId);

    const assignments: StudentSessionAssignment[] = [];
    const students = await StudentService.getStudents(studentIds);

    if (students.length === 0) {
      throw new Error('No students found');
    }

    // Check if the student session pair already exists, and if not, add it
    const existingAssignments: StudentSessionAssignment[] = await this.db.runAndReadAll(
      `SELECT studentId, sessionId FROM student_session_lookup WHERE sessionId = ?`,
      [session.id]
    );
    const existingStudentIds = existingAssignments.map(assignment => assignment.studentId);

    const newStudents = students.filter(student => !existingStudentIds.includes(student.id));

    if (newStudents.length === 0) {
      throw new Error('All students are already assigned to this session');
    }

    const values = newStudents.map(student => `('${student.id}', '${session.id}')`).join(', ');

    await this.db.runWithNoReturned(
      `INSERT INTO student_session_lookup (studentId, sessionId) VALUES ${values}`
    );

    for (const student of newStudents) {
      assignments.push({ studentId: student.id, sessionId: session.id });
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
