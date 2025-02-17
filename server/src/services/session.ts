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

  async getSession(sessionId: string): Promise<{ [key: string]: any }> {
    const result = await this.db.runAndReadAll<{
      id: string;
      start_time: { micros: bigint };
      end_time: { micros: bigint };
      class_id: string;
      professor_id: string;
    }>(
      `SELECT id, start_time, end_time, class_id, professor_id FROM session WHERE id = ?`,
      [sessionId]
    );

    if (result.length > 0) {
      const startTimeDuckDB = result[0].start_time.micros;
      const endTimeDuckDB = result[0].end_time.micros;

      const startTimeDate = Number(startTimeDuckDB) / 1000;
      const endTimeDate = Number(endTimeDuckDB) / 1000;

      // Create a Session object
      const session = <Session>{
        id: result[0].id,
        startTime: new Date(startTimeDate),
        endTime: new Date(endTimeDate),
        classId: result[0].class_id,
        professorId: result[0].professor_id,
      };

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
  async updateSession(
    sessionId: string,
    startTime: Date,
    endTime: Date,
    classId: string,
    professorId: string
  ): Promise<Session> {
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) {
      throw new Error('Session not found');
    }

    await this.db.runWithNoReturned(
      `UPDATE session SET start_time = ?, end_time = ?, class_id = ?, professor_id = ? WHERE id = ?`,
      [startTime, endTime, classId, professorId, sessionId]
    );

    return { id: sessionId, startTime, endTime, classId, professorId };
  }

  async getStudentsForSession(sessionId: string): Promise<string[]> {
    const result = await this.db.runAndReadAll<{ student_id: string }>(
      `SELECT student_id FROM student_session_lookup WHERE session_id = ?`,
      [sessionId]
    );

    if (result.length > 0) {
      return result.map((row) => row.student_id);
    }
    throw new Error('No students found for this session');
  }
}

export default new SessionService();
