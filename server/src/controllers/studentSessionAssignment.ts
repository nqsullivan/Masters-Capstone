import { Request, Response, NextFunction } from 'express';
import StudentSessionAssignmentService from '../services/studentSessionAssignmentService.ts';

export const addStudentToSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, sessionId } = req.body;

    const assignment =
      await StudentSessionAssignmentService.addStudentToSession(
        studentId,
        sessionId
      );

    res.status(201).json(assignment);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteStudentFromSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, sessionId } = req.params;
    await StudentSessionAssignmentService.deleteStudentFromSession(
      studentId,
      sessionId
    );

    res.status(200).json({ message: 'Student removed from session' });
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};
