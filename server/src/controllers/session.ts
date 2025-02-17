import e, { Request, Response, NextFunction } from 'express';
import SessionService from '../services/session.ts';
/*
export interface Session {
    classId: string;
    startTime: Date;
    endTime: Date;
    id: string;
    professorId: string;
}*/
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
    next();
  } catch (e: any) {
    console.log('what');
    console.log(e);
    res.status(400).json({ error: e.message });
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
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};
const getSession = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { id } = req.params;
    try {
        const session = await SessionService.getSession(id);
        if (session) {
            const sessionWithStrings = {
                ... session,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime.toISOString()
            }
            res.status(200).send(sessionWithStrings);
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
        next();
    } catch (e: any) {
        console.log(e);
        res.status(400).json({ error: e.message });
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
        console.log(updatedSession);
        if (updatedSession) {
            const sessionWithStrings = {
                ... updatedSession,
                startTime: updatedSession.startTime,
                endTime: updatedSession.endTime
            }
            res.status(200).send(sessionWithStrings);
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
        next();
    } catch (e: any) {
        console.log(e);
        res.status(400).json({ error: e.message });
    }
};

export { createSession, deleteSession, getSession, updateSession };

