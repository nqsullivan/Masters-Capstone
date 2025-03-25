import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../services/database.js';
import { Class } from '../models/class.js';
import { ClassPageResponse } from '../models/classPageResponse.js';
import UtilService from './util.js';
import { Session } from '../models/session.js';

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
      `SELECT id, name, roomNumber, startTime, endTime FROM class WHERE id = ?`,
      [id]
    );

    if (result.length > 0) {
      return {
        id: id,
        name: result[0].name,
        roomNumber: result[0].roomNumber,
        startTime: UtilService.formatDate(result[0].startTime),
        endTime: UtilService.formatDate(result[0].endTime)
      }
    }
    throw new Error(`Class with id '${id}' not found`);
  }

  async createClass(name: string, roomNumber: string, startTime: string, endTime: string): Promise<Class> {
    if (!name) {
      throw new Error('Name cannot be empty');
    }

    const id = uuidv4();
    await this.db.runWithNoReturned(
      `INSERT INTO class (id, name, roomNumber, startTime, endTime) VALUES (?, ?, ?, ?, ?)`,
      [id, name, roomNumber, startTime, endTime ]
    );

    return { id, name, roomNumber, startTime, endTime };
  }

  async updateClass(id: string, name: string): Promise<Class> {
    const existingClass = await this.getClass(id);

    await this.db.runWithNoReturned(`UPDATE class SET name = ? WHERE id = ?`, [
      name,
      existingClass.id,
    ]);

    return { id, name, roomNumber: existingClass.roomNumber, startTime: existingClass.startTime, endTime: existingClass.endTime };
  }

  async deleteClass(id: string): Promise<void> {
    const existingClass = await this.getClass(id);

    await this.db.runWithNoReturned(`DELETE FROM class WHERE id = ?`, [
      existingClass.id,
    ]);
  }

  async getClassPage(
    page: number,
    size: number,
    username: string
  ): Promise<ClassPageResponse> {
    const whereClause = `where id in (select classId from professor_class_lookup where username = '${username}')`;
    let pageResponse = await UtilService.buildPageResponse<Class>(
      page,
      size,
      'Class',
      whereClause
    );
    pageResponse.data.forEach(page => {
      page.startTime = UtilService.formatDate(page.startTime)
      page.endTime = UtilService.formatDate(page.endTime)
    })
    return pageResponse
  }

  async getSessionsForClass(classId: string): Promise<Session[]> {
    const result = await this.db.runAndReadAll<{
      id: string;
      startTime: string;
      endTime: string;
      classId: string;
      professorId: string;
    }>(
      `SELECT id, startTime, endTime, classId, professorId FROM session WHERE classId = ?`,
      [classId]
    );

    let sessions: Session[] = [];

    for (const session of result) {
      sessions.push({
        id: session.id,
        startTime: UtilService.formatDate(session.startTime),
        endTime: UtilService.formatDate(session.endTime),
        classId: session.classId,
        professorId: session.professorId,
      });
    }

    return sessions;
  }

  async getSchedulesForRoomNumber(roomNumber: string): Promise<Class[]> {
    const result = await this.db.runAndReadAll<Class>(
      `SELECT id, name, roomNumber, startTime, endTime FROM class WHERE roomNumber = ?`,
      [roomNumber]
    );

    let classes: Class[] = [];
    for (const cls of result) {
      classes.push({
        id: cls.id,
        name: cls.name,
        roomNumber: cls.roomNumber,
        startTime: UtilService.formatDate(cls.startTime),
        endTime: UtilService.formatDate(cls.endTime),
      });
    }

    if (classes.length > 0) {
      return classes;
    }
    throw new Error(`Class with roomNumber '${roomNumber}' not found`);
  }
}

export default new ClassService();
