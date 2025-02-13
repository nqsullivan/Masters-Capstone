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

export { createSession, deleteSession };
