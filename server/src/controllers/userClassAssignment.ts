import { Request, Response, NextFunction } from 'express';
import UserClassAssignmentService from '../services/userClassAssignment.ts';

export const getProfessorsForClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { class_id } = req.params;

    const professors =
      await UserClassAssignmentService.getProfessorsForClass(class_id);

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
    const { username, class_id } = req.body;

    const assignment = await UserClassAssignmentService.assignProfessorToClass(
      username,
      class_id
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
    const { username, class_id } = req.body;
    await UserClassAssignmentService.unassignProfessorFromClass(
      username,
      class_id
    );

    res.status(200).json({ message: 'Professor unassigned from class' });
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
