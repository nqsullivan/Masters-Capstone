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
    classId: string
  ): Promise<Session> {
    if (!classId || !startTime || !endTime) {
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
      `INSERT INTO session (id, startTime, endTime, classId) VALUES (?, ?, ?, ?)`,
      [id, startTime, endTime, classId]
    );

    return { id, startTime, endTime, classId };
  }

  async getSession(sessionId: string): Promise<{ [key: string]: any }> {
    const result = await this.db.runAndReadAll<{
      id: string;
      startTime: string;
      endTime: string;
      classId: string;
    }>(`SELECT id, startTime, endTime, classId FROM session WHERE id = ?`, [
      sessionId,
    ]);

    if (result.length > 0) {
      return {
        id: result[0].id,
        startTime: UtilService.formatDate(result[0].startTime),
        endTime: UtilService.formatDate(result[0].endTime),
        classId: result[0].classId,
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
    classId: string
  ): Promise<Session> {
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) {
      throw new Error('Session not found');
    }

    await this.db.runWithNoReturned(
      `UPDATE session SET startTime = ?, endTime = ?, classId = ?,  WHERE id = ?`,
      [startTime, endTime, classId, sessionId]
    );

    return { id: sessionId, startTime, endTime, classId };
  }

  async addAttendanceRecord(
    sessionId: string,
    studentId: string,
    portraitUrl: string
  ): Promise<Attendance> {
    if (!sessionId || !studentId) {
      throw new Error(
        'sessionId and studentId fields are required'
      );
    }

    const session = await this.getSession(sessionId);
    const student = await StudentService.getStudent(studentId);
    const id = uuidv4();
    portraitUrl = portraitUrl || '';
    const portraitCaptured = portraitUrl !== '';

    await this.db.runWithNoReturned(
      'INSERT INTO attendance (id, studentId, sessionId, portraitUrl, portraitCaptured) VALUES (?, ?, ?, ?, ?)',
      [id, student.id, session.id, portraitUrl, portraitCaptured]
    );

    return await this.getAttendanceRecord(id);
  }

  async getAttendanceRecordsForSessions(
    sessionIds: string[]
  ): Promise<Record<string, Attendance[]>> {
    const attendanceRecords = new Map<string, Attendance[]>();

    const result = await this.db.runAndReadAll<{
      id: string;
      studentId: string;
      sessionId: string;
      checkIn: string | null;
      portraitUrl: string;
      portraitCaptured: boolean;
      FRIdentifiedId: string;
      status: string | null;
      flagged: boolean;
    }>(
      `SELECT id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured, FRIdentifiedId, status, flagged FROM attendance WHERE sessionId IN (${sessionIds.map(() => '?').join(', ')})`,
      [...sessionIds]
    );

    result.forEach((row) => {
      const attendance: Attendance = {
        id: row.id,
        studentId: row.studentId,
        sessionId: row.sessionId,
        checkIn: UtilService.formatDate(row.checkIn || ''),
        portraitUrl: row.portraitUrl,
        portraitCaptured: row.portraitCaptured,
        FRIdentifiedId: row.FRIdentifiedId,
        status: row.status,
        flagged: row.flagged
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
    checkInTime: string | null,
    portraitUrl: string,
    FRIdentifiedId: string | null,
    status: string | null
  ): Promise<Attendance> {
    if (!attendanceId) {
      throw new Error('attendanceId is required');
    }

    const attendance = await this.getAttendanceRecord(attendanceId);
    let flagged = attendance.flagged;

    if(!checkInTime) {
      checkInTime = attendance.checkIn;
    }

    if (!portraitUrl) {
      portraitUrl = attendance.portraitUrl;
    }

    if (!FRIdentifiedId) {
      FRIdentifiedId = attendance.FRIdentifiedId;
    }

    if (attendance.studentId !== FRIdentifiedId) {
      flagged = true;
    }

    if (!status) {
      status = attendance.status;
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (!['ESCALATED', 'DISMISSED'].includes(status)) {
        throw new Error('status field can only be updated to DISMISSED or ESCALATED');
      }
    }
    const portraitCaptured = portraitUrl !== '';

    await this.db.runWithNoReturned(
      'UPDATE attendance SET checkIn = ?, portraitUrl = ?, portraitCaptured = ?, FRIdentifiedId = ?, status = ?, flagged = ? WHERE id = ?',
      [checkInTime, portraitUrl, portraitCaptured, FRIdentifiedId, status, flagged, attendanceId]
    );

    return {
      id: attendance.id,
      studentId: attendance.studentId,
      sessionId: attendance.sessionId,
      checkIn: UtilService.formatDate(checkInTime || ''),
      portraitUrl: portraitUrl,
      portraitCaptured: portraitCaptured,
      FRIdentifiedId: FRIdentifiedId,
      status: status,
      flagged: flagged
    };
  }

  async getAttendanceRecord(attendanceId: string): Promise<Attendance> {
    const result = await this.db.runAndReadAll<{
      id: string;
      studentId: string;
      sessionId: string;
      checkIn: string | null;
      portraitUrl: string;
      portraitCaptured: boolean;
      FRIdentifiedId: string;
      status: string | null;
      flagged: boolean;
    }>(
      `SELECT id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured, FRIdentifiedId, status, flagged FROM attendance WHERE id = ?`,
      [attendanceId]
    );

    if (result.length > 0) {
      return {
        id: result[0].id,
        studentId: result[0].studentId,
        sessionId: result[0].sessionId,
        checkIn: this.getFormattedCheckInTime(result[0].checkIn),
        portraitUrl: result[0].portraitUrl,
        portraitCaptured: result[0].portraitCaptured,
        FRIdentifiedId: result[0].FRIdentifiedId,
        status: result[0].status,
        flagged: result[0].flagged
      };
    }
    throw new Error('Attendance record not found');
  }

  getFormattedCheckInTime(checkIn: string | null) {
    if (checkIn) {
      return UtilService.formatDate(checkIn);
    }
    return null;
  }

  async deleteAttendanceRecord(attendanceId: string): Promise<void> {
    const existingAttendance = await this.getAttendanceRecord(attendanceId);

    await this.db.runWithNoReturned(`DELETE FROM attendance WHERE id = ?`, [
      existingAttendance.id,
    ]);
  }
}

export default new SessionService();
