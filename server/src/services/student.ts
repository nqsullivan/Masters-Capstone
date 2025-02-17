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
      `SELECT id, name, class_id, image FROM student WHERE id = ?`,
      [id]
    );

    if (result.length > 0) {
      return result[0];
    }
    throw new Error(`Student with id '${id}' not found`);
  }

  async createStudent(
    name: string,
    class_id: string,
    image: string
  ): Promise<Student> {
    if (!name || !class_id) {
      throw new Error('Name and class_id cannot be empty');
    }

    const id = uuidv4();
    await this.db.runWithNoReturned(
      `INSERT INTO student (id, name, class_id, image) VALUES (?, ?, ?, ?)`,
      [id, name, class_id, image]
    );

    return { id, name, class_id, image };
  }

  async updateStudent(
    id: string,
    name: string,
    class_id: string,
    image: string
  ): Promise<Student> {
    const existingStudent = await this.getStudent(id);

    await this.db.runWithNoReturned(
      `UPDATE student SET name = ?, class_id = ?, image = ? WHERE id = ?`,
      [name, class_id, image, existingStudent.id]
    );

    return { id, name, class_id, image };
  }

  async deleteStudent(id: string): Promise<void> {
    const existingStudent = await this.getStudent(id);

    await this.db.runWithNoReturned(`DELETE FROM student WHERE id = ?`, [existingStudent.id]);
  }
}

export default new StudentService();
