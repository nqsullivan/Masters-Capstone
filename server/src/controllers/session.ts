import { Request, Response, NextFunction } from 'express';
import SessionService from '../services/session.js';
import AuthService from '../services/auth.js';

const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { startTime, endTime, classId } = req.body;
  try {
    const newSession = await SessionService.createSession(
      startTime,
      endTime,
      classId
    );
    res.status(201).send(newSession);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    next();
  }
};

const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await SessionService.deleteSession(id);
    res.status(204).send();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    next();
  }
};

const getSession = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const session = await SessionService.getSession(id);
    res.status(200).send(session);
  } catch (e: any) {
    if (e.message === 'Session not found') {
      res.status(404).json({ error: e.message });
    } else {
      console.error(e);
      res.status(400).json({ error: e.message });
    }
  } finally {
    next();
  }
};

const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { startTime, endTime, classId } = req.body;
  try {
    const updatedSession = await SessionService.updateSession(
      id,
      startTime,
      endTime,
      classId
    );
    const sessionWithStrings = {
      ...updatedSession,
      startTime: updatedSession.startTime,
      endTime: updatedSession.endTime,
    };
    res.status(200).send(sessionWithStrings);
  } catch (e: any) {
    if (e.message === 'Session not found') {
      res.status(404).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  } finally {
    next();
  }
};

const addAttendanceRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  const { studentId, portraitUrl } = req.body;
  try {
    const attendance = await SessionService.addAttendanceRecord(
      sessionId,
      studentId,
      portraitUrl
    );
    res.status(201).send(attendance);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    next();
  }
};

const modifyAttendanceRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { attendanceId } = req.params;
  const { checkIn, portraitUrl, FRIdentifiedId, status, videoKey } = req.body;
  try {
    const attendance = await SessionService.modifyAttendanceRecord(
      attendanceId,
      checkIn,
      portraitUrl,
      FRIdentifiedId,
      status,
      videoKey
    );
    res.status(200).send(attendance);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    next();
  }
};

const deleteAttendanceRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId, attendanceId } = req.params;
  try {
    await SessionService.deleteAttendanceRecord(attendanceId);
    res.status(204).send();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    next();
  }
};

const getAttendanceRecordsForSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  try {
    const attendanceRecords =
      await SessionService.getAttendanceRecordsForSessions([sessionId]);
    res.status(200).send(attendanceRecords);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    next();
  }
};

const getAttendanceRecordsForProfessorPaged = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = String(req.headers.authorization?.split(' ')[1]);
  const page: number = parseInt(req.query.page as string) || 1;
  const size: number = parseInt(req.query.size as string) || 10;
  const isFlagged: boolean | null =
    req.query.isFlagged === 'true'
      ? true
      : req.query.isFlagged === 'false'
        ? false
        : null;

  try {
    const user = await AuthService.getUser(token);
    if (!user) {
      throw new Error('User not found');
    }

    const { attendanceRecords, totalCount } =
      await SessionService.getAttendanceRecordsForProfessorPaged(
        user.username,
        page,
        size,
        isFlagged
      );

    const attendancePage = {
      page,
      pageSize: size,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / size),
      data: attendanceRecords,
    };

    res.status(200).send(attendancePage);
    next();
  } catch (e: any) {
    if (e.message === 'User not found') {
      res.status(404).json({ error: e.message });
    } else {
      console.error(e);
      res.status(400).json({ error: e.message });
    }
  }
};

export {
  createSession,
  deleteSession,
  getSession,
  updateSession,
  addAttendanceRecord,
  modifyAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceRecordsForSession,
  getAttendanceRecordsForProfessorPaged,
};
