import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../services/database.js';
import { Class } from '../models/class.js';

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
}

export default new ClassService();
