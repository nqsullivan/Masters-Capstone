import e, { Request, Response, NextFunction } from 'express';
import ClassService from '../services/class.js';
import AuthService from '../services/auth.js';

const getClass = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const existingClass = await ClassService.getClass(id);
    res.status(200).send(existingClass);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const createClass = async (req: Request, res: Response, next: NextFunction) => {
  const { name, roomNumber, startTime, endTime } = req.body;
  try {
    const newClass = await ClassService.createClass(name, roomNumber, startTime, endTime);
    res.status(201).send(newClass);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const updateClass = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const updatedClass = await ClassService.updateClass(id, name);
    res.status(200).send(updatedClass);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const deleteClass = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    await ClassService.deleteClass(id);
    res.status(200).send(`Deleted class ${id}`);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const getClassPage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const page: number = parseInt(req.query.page as string) || 1;
  const size: number = parseInt(req.query.size as string) || 10;
  try {
    const user = await AuthService.getUser(token);
    if (!user) {
      throw new Error('User not found');
    }
    const classPage = await ClassService.getClassPage(
      page,
      size,
      user.username
    );
    res.status(200).send(classPage);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const getSessionsForClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { classId } = req.params;
  try {
    const sessions = await ClassService.getSessionsForClass(classId);
    res.status(200).send(sessions);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const getSchedulesForRoomNumber = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { roomNumber } = req.params;
  try {
    const sessions = await ClassService.getSchedulesForRoomNumber(roomNumber);
    res.status(200).send(sessions);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export {
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassPage,
  getSessionsForClass,
  getSchedulesForRoomNumber,
};
