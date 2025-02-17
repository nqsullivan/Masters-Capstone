import DatabaseAccess from './database.ts';
import { UserClassAssignment } from '../models/userClassAssignment.ts';
import { User } from '../models/user.ts';

class UserClassAssignmentService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async getProfessorsForClass(
    class_id: string
  ): Promise<UserClassAssignment[]> {
    const classObj = await this.db.runAndReadAll(
      `SELECT id FROM class WHERE id = ?`,
      [class_id]
    );
    if (classObj.length === 0) {
      throw new Error(`Class with id '${class_id}' not found`);
    }

    const result = await this.db.runAndReadAll<UserClassAssignment>(
      `SELECT username FROM professor_class_lookup WHERE class_id = ?`,
      [class_id]
    );

    return result;
  }

  async getProfessor(username: string): Promise<User> {
    const user = await this.db.runAndReadAll<User>(
      `SELECT username, password, type FROM user WHERE username = ?`,
      [username]
    );
    if (user.length === 0) {
      throw new Error(`User with username '${username}' not found`);
    }
    return user[0];
  }

  async getClassesForProfessor(
    username: string
  ): Promise<UserClassAssignment[]> {
    const user = await this.getProfessor(username);
    const result = await this.db.runAndReadAll<UserClassAssignment>(
      `SELECT uca.class_id, c.name
       FROM professor_class_lookup uca 
       JOIN class c ON uca.class_id = c.id 
       WHERE uca.username = ?`,
      [username]
    );

    return result;
  }

  async assignProfessorToClass(
    username: string,
    class_id: string
  ): Promise<UserClassAssignment> {
    const user = await this.getProfessor(username);

    const classObj = await this.db.runAndReadAll(
      `SELECT id FROM class WHERE id = ?`,
      [class_id]
    );
    if (classObj.length === 0) {
      throw new Error(`Class with id '${class_id}' not found`);
    }

    const existingAssignment = await this.db.runAndReadAll(
      `SELECT username, class_id FROM professor_class_lookup WHERE username = ? AND class_id = ?`,
      [username, class_id]
    );
    if (existingAssignment.length > 0) {
      throw new Error(
        `User with username '${username}' is already assigned to class with id '${class_id}'`
      );
    }

    await this.db.runWithNoReturned(
      `INSERT INTO professor_class_lookup (username, class_id) VALUES (?, ?)`,
      [username, class_id]
    );

    return { username, class_id };
  }

  async unassignProfessorFromClass(
    username: string,
    class_id: string
  ): Promise<void> {
    await this.db.runWithNoReturned(
      `DELETE FROM professor_class_lookup WHERE username = ? AND class_id = ?`,
      [username, class_id]
    );
  }
}

export default new UserClassAssignmentService();
