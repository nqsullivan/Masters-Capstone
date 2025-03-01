import { Request, Response, NextFunction } from 'express';
import StudentService from '../services/student.js';

const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const student = await StudentService.getStudent(id);
    res.status(201).send(student);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
};

const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, image } = req.body;
  try {
    const student = await StudentService.createStudent(name, image || null);
    res.status(201).send(student);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
};

const updateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { name, image } = req.body;
  try {
    const student = await StudentService.updateStudent(id, name, image);
    res.status(200).send(student);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
};

const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await StudentService.deleteStudent(id);
    res.status(200).send(`Deleted student ${id}`);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
};

const getStudentPage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page: number = parseInt(req.query.page as string) || 1;
  const size: number = parseInt(req.query.size as string) || 10;
  try {
    const studentPage = await StudentService.getStudentPage(page, size);
    res.status(200).send(studentPage);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export {
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPage,
};
