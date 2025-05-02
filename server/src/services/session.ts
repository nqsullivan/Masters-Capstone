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
      throw new Error('sessionId and studentId fields are required');
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
      name: string;
      image: string;
      sessionId: string;
      checkIn: string | null;
      portraitUrl: string;
      portraitCaptured: boolean;
      FRIdentifiedId: string;
      status: string | null;
      flagged: boolean;
      videoKey: string;
    }>(
      `SELECT a.id, a.studentId, s.name, s.image, a.sessionId, a.checkIn, a.portraitUrl, a.portraitCaptured, a.FRIdentifiedId, a.status, a.flagged FROM attendance a JOIN student s ON a.studentId = s.id WHERE sessionId IN (${sessionIds.map(() => '?').join(', ')})`,
      [...sessionIds]
    );

    result.forEach(async (row) => {
      const attendance: Attendance = {
        id: row.id,
        studentId: row.studentId,
        studentName: row.name,
        studentImage: row.image,
        sessionId: row.sessionId,
        checkIn: UtilService.formatDate(row.checkIn || ''),
        portraitUrl: row.portraitUrl,
        portraitCaptured: row.portraitCaptured,
        FRIdentifiedId: row.FRIdentifiedId,
        status: row.status,
        flagged: row.flagged,
        videoKey: row.videoKey || null,
      };

      if (attendanceRecords.has(row.sessionId)) {
        attendanceRecords.get(row.sessionId)?.push(attendance);
      } else {
        attendanceRecords.set(row.sessionId, [attendance]);
      }
    });

    return Object.fromEntries(attendanceRecords);
  }

  async getAttendanceRecordsForProfessorPaged(
    professorId: string,
    page: number,
    pageSize: number,
    isFlagged: boolean | null
  ): Promise<{ attendanceRecords: Attendance[]; totalCount: number }> {
    const offset = (page - 1) * pageSize;

    const result = await this.db.runAndReadAll<{
      id: string;
      studentId: string;
      name: string;
      image: string;
      sessionId: string;
      checkIn: string;
      portraitUrl: string;
      portraitCaptured: boolean;
      FRIdentifiedId: string;
      status: string | null;
      flagged: boolean;
      videoKey: string;
    }>(
      `
      SELECT a.id, a.studentId, s.name, s.image, a.sessionId, a.checkIn, a.portraitUrl, 
             a.portraitCaptured, a.FRIdentifiedId, a.status, a.flagged, a.videoKey
      FROM attendance a
      JOIN student s ON a.studentId = s.id
      JOIN student_class_lookup scl ON s.id = scl.studentId
      JOIN professor_class_lookup pcl ON scl.classId = pcl.classId
      WHERE pcl.username = ?
        AND (? IS NULL OR a.flagged = ?)
      LIMIT ? OFFSET ?
      `,
      [professorId, isFlagged, isFlagged, pageSize, offset]
    );

    const totalCountResult = await this.db.runAndReadAll<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM attendance a
      JOIN student s ON a.studentId = s.id
      JOIN student_class_lookup scl ON s.id = scl.studentId
      JOIN professor_class_lookup pcl ON scl.classId = pcl.classId
      WHERE pcl.username = ?
        AND (? IS NULL OR a.flagged = ?)
      `,
      [professorId, isFlagged, isFlagged]
    );

    const totalCount = UtilService.formatNumber(totalCountResult[0].count);

    const attendanceRecords = result.map((row) => ({
      id: row.id,
      studentId: row.studentId,
      studentName: row.name,
      studentImage: row.image,
      sessionId: row.sessionId,
      checkIn: UtilService.formatDate(row.checkIn),
      portraitUrl: row.portraitUrl,
      portraitCaptured: row.portraitCaptured,
      FRIdentifiedId: row.FRIdentifiedId,
      status: row.status,
      flagged: row.flagged,
      videoKey: row.videoKey || null,
    }));

    return { attendanceRecords, totalCount };
  }

  async modifyAttendanceRecord(
    attendanceId: string,
    checkIn: string | null | undefined,
    portraitUrl: string | null | undefined,
    FRIdentifiedId: string | null | undefined,
    status: string | null | undefined,
    videoKey: string | null | undefined
  ): Promise<Attendance> {
    if (!attendanceId) {
      throw new Error('attendanceId is required');
    }

    const attendance = await this.getAttendanceRecord(attendanceId);
    const updates: Record<string, any> = {};
    let flagged = attendance.flagged;

    if (checkIn != null) updates.checkIn = checkIn;
    if (portraitUrl != null) {
      updates.portraitUrl = portraitUrl;
      updates.portraitCaptured = portraitUrl !== '';
    }

    if (FRIdentifiedId != null) {
      updates.FRIdentifiedId = FRIdentifiedId;
      if (attendance.studentId !== FRIdentifiedId) {
        flagged = true;
      }
    }

    if (status != null) {
      if (!['ESCALATED', 'DISMISSED', ''].includes(status)) {
        throw new Error(
          'status field can only be updated to be blank or one of the values: [DISMISSED, ESCALATED]'
        );
      }
      updates.status = status;
    }

    if (videoKey != null) updates.videoKey = videoKey;

    if ('FRIdentifiedId' in updates) {
      updates.flagged = flagged;
    }

    if (Object.keys(updates).length === 0) {
      return attendance;
    }

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), attendanceId];

    try {
      await this.db.runWithNoReturned(
        `UPDATE attendance SET ${setClause} WHERE id = ?`,
        values
      );
    } catch (e) {
      console.error('DB update error:', e);
      throw e;
    }

    const studentResult = await this.db.runAndReadAll<{
      name: string;
      image: string;
    }>(`SELECT name, image FROM student WHERE id = ?`, [attendance.studentId]);

    const final = {
      ...attendance,
      ...updates,
      studentName: studentResult[0].name,
      studentImage: studentResult[0].image,
      checkIn: UtilService.formatDate(updates.checkIn ?? attendance.checkIn),
      portraitCaptured: updates.portraitCaptured ?? attendance.portraitCaptured,
    };

    return final;
  }

  async getAttendanceRecord(attendanceId: string): Promise<Attendance> {
    const result = await this.db.runAndReadAll<{
      id: string;
      studentId: string;
      name: string;
      image: string;
      sessionId: string;
      checkIn: string | null;
      portraitUrl: string;
      portraitCaptured: boolean;
      FRIdentifiedId: string;
      status: string | null;
      flagged: boolean;
      videoKey: string;
    }>(
      `SELECT a.id, a.studentId, s.name, s.image, a.sessionId, a.checkIn, a.portraitUrl, a.portraitCaptured, a.FRIdentifiedId, a.status, a.flagged, a.videoKey
      FROM attendance a
      JOIN student s ON a.studentId = s.id WHERE a.id = ?`,
      [attendanceId]
    );

    if (result.length > 0) {
      return {
        id: result[0].id,
        studentId: result[0].studentId,
        studentName: result[0].name,
        studentImage: result[0].image,
        sessionId: result[0].sessionId,
        checkIn: this.getFormattedCheckInTime(result[0].checkIn),
        portraitUrl: result[0].portraitUrl,
        portraitCaptured: result[0].portraitCaptured,
        FRIdentifiedId: result[0].FRIdentifiedId,
        status: result[0].status,
        flagged: result[0].flagged,
        videoKey: result[0].videoKey,
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
