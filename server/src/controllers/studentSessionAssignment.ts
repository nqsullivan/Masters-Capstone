import { Request, Response, NextFunction } from 'express';
import StudentSessionAssignmentService from '../services/studentSessionAssignmentService.ts';

/*
export interface StudentSessionAssignment {
    studentId: string;
    sessionId: string;
}
*/

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
    console.log(e);
    res.status(400).json({ error: e.message });
  }
};

export const deleteStudentFromSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, sessionId } = req.body;
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

/*
export const getStudentsFromSession = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { sessionId } = req.params;

        const studentIds = await StudentSessionAssignmentService.getStudentsFromSession(
            sessionId
        );

        res.status(200).json(studentIds);
        next();
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const getSessionsForStudent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studentId } = req.params;

        const sessionIds = await StudentSessionAssignmentService.getSessionsForStudent(
            studentId
        );

        res.status(200).json(sessionIds);
        next();
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};
*/
