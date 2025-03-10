import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../services/database.js';
import { Class } from '../models/class.js';
import { ClassPageResponse } from '../models/classPageResponse.js';
import UtilService from './util.js';

class ClassService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async getClass(id: string): Promise<Class> {
    const result = await this.db.runAndReadAll<Class>(
      `SELECT id, name FROM class WHERE id = ?`,
      [id]
    );

    if (result.length > 0) {
      return result[0];
    }
    throw new Error(`Class with id '${id}' not found`);
  }

  async createClass(name: string): Promise<Class> {
    if (!name) {
      throw new Error('Name cannot be empty');
    }

    const id = uuidv4();
    await this.db.runWithNoReturned(
      `INSERT INTO class (id, name) VALUES (?, ?)`,
      [id, name]
    );

    return { id, name };
  }

  async updateClass(id: string, name: string): Promise<Class> {
    const existingClass = await this.getClass(id);

    await this.db.runWithNoReturned(`UPDATE class SET name = ? WHERE id = ?`, [
      name,
      existingClass.id,
    ]);

    return { id, name };
  }

  async deleteClass(id: string): Promise<void> {
    const existingClass = await this.getClass(id);

    await this.db.runWithNoReturned(`DELETE FROM class WHERE id = ?`, [
      existingClass.id,
    ]);
  }

  async getClassPage(page: number, size: number): Promise<ClassPageResponse> {
    return await UtilService.buildPageResponse<Class>(page, size, 'Class');
  }

  async getSessionsForClass(classId: string): Promise<{ id: string, start_time: string, end_time: string, class_id: string, professor_id: string }[]> {
    const result = await this.db.runAndReadAll<{ id: string, start_time: string, end_time: string, class_id: string, professor_id: string }>(
      `SELECT id, start_time, end_time, class_id, professor_id FROM session WHERE class_id = ?`,
      [classId]
    );

    for (const session of result) {
      session.start_time = UtilService.formatDate(session.start_time);
      session.end_time = UtilService.formatDate(session.end_time);
    }

    return result;
  }
}

export default new ClassService();
