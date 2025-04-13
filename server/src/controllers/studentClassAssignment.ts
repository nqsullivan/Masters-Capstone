import { Request, Response, NextFunction } from 'express';
import StudentClassAssignmentService from '../services/studentClassAssignment.js';

export const addStudentsToClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;

    const assignment = await StudentClassAssignmentService.addStudentsToClass(
      studentIds,
      classId
    );

    res.status(201).json(assignment);
    next();
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

export const getStudentsForClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.params;
    const students =
      await StudentClassAssignmentService.getStudentsForClass(classId);

    res.status(200).json(students);
    next();
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

export const deleteStudentFromClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, studentId } = req.params;

    await StudentClassAssignmentService.deleteStudentFromClass(
      classId,
      studentId
    );

    res
      .status(200)
      .json({ message: 'Student removed from class successfully' });
    next();
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};
