import { Request, Response, NextFunction } from 'express';
import UserClassAssignmentService from '../services/userClassAssignment.js';
import ClassService from '../services/class.js';
import UserService from '../services/user.js';

export const getProfessorsForClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.params;

    const professors =
      await UserClassAssignmentService.getProfessorsForClass(classId);

    res.status(200).json(professors);
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getClassesForProfessor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.params;

    const classes =
      await UserClassAssignmentService.getClassesForProfessor(username);

    res.status(200).json(classes);
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const assignProfessorToClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, classId } = req.body;
    const assignment = await UserClassAssignmentService.assignProfessorToClass(
      username,
      classId
    );

    res.status(201).json(assignment);
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const unassignProfessorFromClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, classId } = req.body;

    const professor = await UserService.getUser(username);
    const classObj = await ClassService.getClass(classId);

    await UserClassAssignmentService.unassignProfessorFromClass(
      professor.username,
      classObj.id
    );

    res.status(200).json({ message: 'Professor unassigned from class' });
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
