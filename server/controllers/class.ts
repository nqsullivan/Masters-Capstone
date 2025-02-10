import e, { Request, Response, NextFunction } from 'express';
import ClassService from '../services/class.ts';

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
  const { name } = req.body;
  try {
    const newClass = await ClassService.createClass(name);
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

export { getClass, createClass, updateClass, deleteClass };
