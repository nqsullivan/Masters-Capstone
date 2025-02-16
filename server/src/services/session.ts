import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../services/database.ts';
import { Session } from '../models/session.ts';

class SessionService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }
  async createSession(
    startTime: Date,
    endTime: Date,
    classId: string,
    professorId: string
  ): Promise<Session> {
    if (!classId || !startTime || !endTime || !professorId) {
      throw new Error('All fields are required');
    }

    // Check if classId exists in the class table
    const classExists = await this.db.runAndReadAll<{ id: string }>(
      `SELECT id FROM class WHERE id = ?`,
      [classId]
    );

    if (classExists.length === 0) {
      throw new Error('Class not found');
    }

    const id = uuidv4();

    await this.db.runWithNoReturned(
      `INSERT INTO session (id, start_time, end_time, class_id, professor_id) VALUES (?, ?, ?, ?, ?)`,
      [id, startTime, endTime, classId, professorId]
    );

    return { id, startTime, endTime, classId, professorId };
  }

  async getSession(sessionId: string): Promise<Session> {
    const result = await this.db.runAndReadAll<Session>(
      `SELECT id, start_time, end_time, class_id, professor_id FROM session WHERE id = ?`,
      [sessionId]
    );

    if (result.length > 0) {
      const session = result[0];
      session.startTime = new Date(session.startTime);
      session.endTime = new Date(session.endTime);
      return session;
    }
    throw new Error('Session not found');
  }

  async deleteSession(sessionId: string): Promise<void> {
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) {
      throw new Error('Session not found');
    }

    await this.db.runWithNoReturned(`DELETE FROM session WHERE id = ?`, [
      sessionId,
    ]);
  }
}

export default new SessionService();
