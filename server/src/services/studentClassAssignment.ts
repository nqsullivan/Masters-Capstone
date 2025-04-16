import DatabaseAccess from '../services/database.js';
import { StudentClassAssignment } from '../models/studentClassAssignment.js';

class StudentClassAssignmentService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async addStudentsToClass(
    studentIds: string[],
    classId: string
  ): Promise<StudentClassAssignment[]> {
    const classResult = await this.db.runAndReadAll(
      `SELECT id FROM class WHERE id = ?`,
      [classId]
    );
    if (classResult.length === 0) {
      throw new Error(`Class with id '${classId}' not found`);
    }

    const assignments: StudentClassAssignment[] = [];
    for (const studentId of studentIds) {
      const student = await this.db.runAndReadAll(
        `SELECT id FROM student WHERE id = ?`,
        [studentId]
      );
      if (student.length === 0) {
        throw new Error(`Student with id '${studentId}' not found`);
      }

      const existingAssignment = await this.db.runAndReadAll(
        `SELECT studentId, classId FROM student_class_lookup WHERE studentId = ? AND classId = ?`,
        [studentId, classId]
      );
      if (existingAssignment.length == 0) {
        await this.db.runWithNoReturned(
          `INSERT INTO student_class_lookup (studentId, classId) VALUES (?, ?)`,
          [studentId, classId]
        );
      }

      assignments.push({ studentId, classId: classId });
    }

    return assignments;
  }

  async deleteStudentFromClass(
    classId: string,
    studentId: string
  ): Promise<void> {
    const existingAssignment = await this.db.runAndReadAll(
      `SELECT studentId, classId FROM student_class_lookup WHERE classId = ? AND studentId = ?`,
      [classId, studentId]
    );
    if (existingAssignment.length === 0) {
      throw new Error(
        `No assignment found for student with id '${studentId}' and class with id '${classId}'`
      );
    }

    await this.db.runWithNoReturned(
      `DELETE FROM student_class_lookup WHERE classId = ? AND studentId = ?`,
      [classId, studentId]
    );
  }

  async getStudentsForClass(classId: string): Promise<string[]> {
    if (!classId) {
      throw new Error('Invalid classId provided');
    }

    const classResult = await this.db.runAndReadAll(
      `SELECT id FROM class WHERE id = ?`,
      [classId]
    );

    if (classResult.length === 0) {
      throw new Error(`Class with id '${classId}' not found`);
    }

    const result = await this.db.runAndReadAll<StudentClassAssignment>(
      `SELECT studentId, classId FROM student_class_lookup WHERE classId = ?`,
      [classId]
    );

    return result.map((row) => row.studentId);
  }
}

export default new StudentClassAssignmentService();
