import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../services/database.js';
import { Session } from '../models/session.js';
import { Attendance } from '../models/attendance.js';
import StudentService from './student.js';
import UtilService from './util.js';

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
      `INSERT INTO session (id, startTime, endTime, classId, professorId) VALUES (?, ?, ?, ?, ?)`,
      [id, startTime, endTime, classId, professorId]
    );

    return { id, startTime, endTime, classId, professorId };
  }

  async getSession(sessionId: string): Promise<{ [key: string]: any }> {
    const result = await this.db.runAndReadAll<{
      id: string;
      startTime: { micros: bigint };
      endTime: { micros: bigint };
      classId: string;
      professorId: string;
    }>(
      `SELECT id, startTime, endTime, classId, professorId FROM session WHERE id = ?`,
      [sessionId]
    );

    if (result.length > 0) {
      const startTimeDuckDB = result[0].startTime.micros;
      const endTimeDuckDB = result[0].endTime.micros;

      const startTimeDate = Number(startTimeDuckDB) / 1000;
      const endTimeDate = Number(endTimeDuckDB) / 1000;

      // Create a Session object
      const session = <Session>{
        id: result[0].id,
        startTime: new Date(startTimeDate),
        endTime: new Date(endTimeDate),
        classId: result[0].classId,
        professorId: result[0].professorId,
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
      `UPDATE session SET startTime = ?, endTime = ?, classId = ?, professorId = ? WHERE id = ?`,
      [startTime, endTime, classId, professorId, sessionId]
    );

    return { id: sessionId, startTime, endTime, classId, professorId };
  }

  async getStudentsForSession(sessionId: string): Promise<string[]> {
    const result = await this.db.runAndReadAll<{ studentId: string }>(
      `SELECT studentId FROM student_session_lookup WHERE sessionId = ?`,
      [sessionId]
    );

    if (result.length > 0) {
      return result.map((row) => row.studentId);
    }

    return [];
  }

  async addAttendanceRecord(
    sessionId: string,
    studentId: string,
    checkInTime: string,
    portraitUrl: string
  ): Promise<Attendance> {
    if (!sessionId || !studentId || !checkInTime) {
      throw new Error(
        'sessionId, studentId, and checkInTime fields are required'
      );
    }

    const session = await this.getSession(sessionId);
    const student = await StudentService.getStudent(studentId);
    const id = uuidv4();
    portraitUrl = portraitUrl || '';
    const portraitCaptured = portraitUrl !== '';

    await this.db.runWithNoReturned(
      'INSERT INTO attendance (id, studentId, sessionId, checkIn, portaitUrl, portait_captured) VALUES (?, ?, ?, ?, ?, ?)',
      [id, student.id, session.id, checkInTime, portraitUrl, portraitCaptured]
    );

    return {
      id,
      studentId: student.id,
      sessionId: session.id,
      checkIn: checkInTime,
      portaitUrl: portraitUrl,
      portait_captured: portraitCaptured,
    };
  }

  async getAttendanceRecordsForSessions(
    sessionIds: string[]
  ): Promise<Record<string, Attendance[]>> {
    const attendanceRecords = new Map<string, Attendance[]>();

    const result = await this.db.runAndReadAll<{
      id: string;
      studentId: string;
      sessionId: string;
      checkIn: string;
      portaitUrl: string;
      portait_captured: boolean;
    }>(
      `SELECT id, studentId, sessionId, checkIn, portaitUrl, portait_captured FROM attendance WHERE sessionId IN (${sessionIds.map(() => '?').join(', ')})`,
      [...sessionIds]
    );

    result.forEach((row) => {
      const attendance: Attendance = {
        id: row.id,
        studentId: row.studentId,
        sessionId: row.sessionId,
        checkIn: UtilService.formatDate(row.checkIn),
        portaitUrl: row.portaitUrl,
        portait_captured: row.portait_captured,
      };

      if (attendanceRecords.has(row.sessionId)) {
        attendanceRecords.get(row.sessionId)?.push(attendance);
      } else {
        attendanceRecords.set(row.sessionId, [attendance]);
      }
    });

    return Object.fromEntries(attendanceRecords);
  }
}

export default new SessionService();
