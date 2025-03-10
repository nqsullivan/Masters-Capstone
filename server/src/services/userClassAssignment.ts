import DatabaseAccess from './database.js';
import { UserClassAssignment } from '../models/userClassAssignment.js';
import UserService from './user.js';
import ClassService from './class.js';

class UserClassAssignmentService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async getProfessorsForClass(classId: string): Promise<UserClassAssignment[]> {
    const classObj = await ClassService.getClass(classId);
    const result = await this.db.runAndReadAll<UserClassAssignment>(
      `SELECT username FROM professor_class_lookup WHERE classId = ?`,
      [classObj.id]
    );

    return result;
  }

  async getClassesForProfessor(
    username: string
  ): Promise<UserClassAssignment[]> {
    const user = await UserService.getUser(username);
    const result = await this.db.runAndReadAll<UserClassAssignment>(
      `SELECT uca.classId as id, c.name
       FROM professor_class_lookup uca 
       JOIN class c ON uca.classId = c.id 
       WHERE uca.username = ?`,
      [user.username]
    );

    return result;
  }

  async assignProfessorToClass(
    username: string,
    classId: string
  ): Promise<UserClassAssignment> {
    const user = await UserService.getUser(username);
    const classObj = await ClassService.getClass(classId);

    const existingAssignment = await this.db.runAndReadAll(
      `SELECT username, classId FROM professor_class_lookup WHERE username = ? AND classId = ?`,
      [user.username, classObj.id]
    );
    if (existingAssignment.length > 0) {
      throw new Error(
        `User with username '${user.username}' is already assigned to class with id '${classObj.id}'`
      );
    }

    await this.db.runWithNoReturned(
      `INSERT INTO professor_class_lookup (username, classId) VALUES (?, ?)`,
      [user.username, classObj.id]
    );

    return { username: user.username, classId: classObj.id };
  }

  async unassignProfessorFromClass(
    username: string,
    classId: string
  ): Promise<void> {
    await this.db.runWithNoReturned(
      `DELETE FROM professor_class_lookup WHERE username = ? AND classId = ?`,
      [username, classId]
    );
  }
}

export default new UserClassAssignmentService();
