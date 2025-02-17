import { Request, Response, NextFunction } from 'express';
import StudentService from '../services/student.ts';

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

export { getStudent, createStudent, updateStudent, deleteStudent };
