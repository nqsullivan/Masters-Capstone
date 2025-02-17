import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../services/database.ts';
import { Student } from '../models/student.ts';

class StudentService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async getStudent(id: string): Promise<Student> {
    const result = await this.db.runAndReadAll<Student>(
      `SELECT id, name, image FROM student WHERE id = ?`,
      [id]
    );

    if (result.length > 0) {
      return result[0];
    }
    throw new Error(`Student with id '${id}' not found`);
  }

  async createStudent(name: string, image: string): Promise<Student> {
    if (!name) {
      throw new Error('Name cannot be empty');
    }

    if (!image) {
      image = '';
    }

    const id = uuidv4();
    await this.db.runWithNoReturned(
      `INSERT INTO student (id, name, image) VALUES (?, ?, ?)`,
      [id, name, image]
    );

    return { id, name, image };
  }

  async updateStudent(
    id: string,
    name: string,
    image: string
  ): Promise<Student> {
    const existingStudent = await this.getStudent(id);

    await this.db.runWithNoReturned(
      `UPDATE student SET name = ?, image = ? WHERE id = ?`,
      [name, image, existingStudent.id]
    );

    return { id, name, image };
  }

  async deleteStudent(id: string): Promise<void> {
    const existingStudent = await this.getStudent(id);

    await this.db.runWithNoReturned(`DELETE FROM student WHERE id = ?`, [
      existingStudent.id,
    ]);
  }
}

export default new StudentService();
