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
    startTime: string,
    endTime: string,
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
      startTime: string;
      endTime: string;
      classId: string;
      professorId: string;
    }>(
      `SELECT id, startTime, endTime, classId, professorId FROM session WHERE id = ?`,
      [sessionId]
    );

    if (result.length > 0) {
      return {
        id: result[0].id,
        startTime: UtilService.formatDate(result[0].startTime),
        endTime: UtilService.formatDate(result[0].endTime),
        classId: result[0].classId,
        professorId: result[0].professorId,
      };
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
    startTime: string,
    endTime: string,
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
      'INSERT INTO attendance (id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured) VALUES (?, ?, ?, ?, ?, ?)',
      [id, student.id, session.id, checkInTime, portraitUrl, portraitCaptured]
    );

    return {
      id,
      studentId: student.id,
      sessionId: session.id,
      checkIn: UtilService.formatDate(checkInTime),
      portraitUrl: portraitUrl,
      portraitCaptured: portraitCaptured,
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
      portraitUrl: string;
      portraitCaptured: boolean;
    }>(
      `SELECT id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured FROM attendance WHERE sessionId IN (${sessionIds.map(() => '?').join(', ')})`,
      [...sessionIds]
    );

    result.forEach((row) => {
      const attendance: Attendance = {
        id: row.id,
        studentId: row.studentId,
        sessionId: row.sessionId,
        checkIn: UtilService.formatDate(row.checkIn),
        portraitUrl: row.portraitUrl,
        portraitCaptured: row.portraitCaptured,
      };

      if (attendanceRecords.has(row.sessionId)) {
        attendanceRecords.get(row.sessionId)?.push(attendance);
      } else {
        attendanceRecords.set(row.sessionId, [attendance]);
      }
    });

    return Object.fromEntries(attendanceRecords);
  }

  async modifyAttendanceRecord(
    attendanceId: string,
    checkInTime: string,
    portraitUrl: string
  ): Promise<Attendance> {
    if (!attendanceId || !checkInTime) {
      throw new Error('attendanceId, and checkInTime fields are required');
    }

    const attendance = await this.getAttendanceRecord(attendanceId);
    portraitUrl = portraitUrl || '';
    const portraitCaptured = portraitUrl !== '';

    await this.db.runWithNoReturned(
      'UPDATE attendance SET checkIn = ?, portraitUrl = ?, portraitCaptured = ? WHERE id = ?',
      [checkInTime, portraitUrl, portraitCaptured, attendanceId]
    );

    return {
      id: attendance.id,
      studentId: attendance.studentId,
      sessionId: attendance.sessionId,
      checkIn: UtilService.formatDate(checkInTime),
      portraitUrl: portraitUrl,
      portraitCaptured: portraitCaptured,
    };
  }

  async getAttendanceRecord(attendanceId: string): Promise<Attendance> {
    const result = await this.db.runAndReadAll<{
      id: string;
      studentId: string;
      sessionId: string;
      checkIn: string;
      portraitUrl: string;
      portraitCaptured: boolean;
    }>(
      `SELECT id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured FROM attendance WHERE id = ?`,
      [attendanceId]
    );

    if (result.length > 0) {
      return {
        id: result[0].id,
        studentId: result[0].studentId,
        sessionId: result[0].sessionId,
        checkIn: UtilService.formatDate(result[0].checkIn),
        portraitUrl: result[0].portraitUrl,
        portraitCaptured: result[0].portraitCaptured,
      };
    }
    throw new Error('Attendance record not found');
  }

  async deleteAttendanceRecord(attendanceId: string): Promise<void> {
    const existingAttendance = await this.getAttendanceRecord(attendanceId);
    if (!existingAttendance) {
      throw new Error('Attendance record not found');
    }

    await this.db.runWithNoReturned(`DELETE FROM attendance WHERE id = ?`, [
      attendanceId,
    ]);
  }
}

export default new SessionService();
