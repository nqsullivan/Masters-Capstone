import { Request, Response, NextFunction } from 'express';
import SessionService from '../services/session.js';

const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { startTime, endTime, classId, professorId } = req.body;
  try {
    const newSession = await SessionService.createSession(
      startTime,
      endTime,
      classId,
      professorId
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
    if (session) {
      res.status(200).send(session);
    } else {
      throw new Error('Session not found');
    }
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
  const { startTime, endTime, classId, professorId } = req.body;
  try {
    const updatedSession = await SessionService.updateSession(
      id,
      startTime,
      endTime,
      classId,
      professorId
    );
    if (updatedSession) {
      const sessionWithStrings = {
        ...updatedSession,
        startTime: updatedSession.startTime,
        endTime: updatedSession.endTime,
      };
      res.status(200).send(sessionWithStrings);
    } else {
      throw new Error('Session not found');
    }
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

const getStudentsForSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  try {
    const studentIds = await SessionService.getStudentsForSession(sessionId);
    if (studentIds.length > 0) {
      res.status(200).send(studentIds);
    } else {
      await SessionService.getSession(sessionId);
      res.status(200).send([]);
    }
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
  const { studentId, checkInTime, portraitUrl } = req.body;
  console.log('sessionId', sessionId);
  console.log('studentId', studentId);
  console.log('checkInTime', checkInTime);
  console.log('portraitUrl', portraitUrl);
  try {
    const attendance = await SessionService.addAttendanceRecord(
      sessionId,
      studentId,
      checkInTime,
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
  const { sessionId, attendanceId } = req.params;
  const { checkInTime, portraitUrl } = req.body;
  try {
    const attendance = await SessionService.modifyAttendanceRecord(
      attendanceId,
      checkInTime,
      portraitUrl
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

const getAttendanceRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  try {
    const attendanceRecords = await SessionService.getAttendanceRecordsForSessions([sessionId]);
    res.status(200).send(attendanceRecords);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  } finally {
    next();
  }
};

export {
  createSession,
  deleteSession,
  getSession,
  updateSession,
  getStudentsForSession,
  addAttendanceRecord,
  modifyAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceRecords,
};
