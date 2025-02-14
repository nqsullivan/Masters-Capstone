import e, { Request, Response, NextFunction } from 'express';
import { CreateLogRequest } from '../models/logRequest';
import LogService from '../services/log.ts';

const getLog = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const existingLog = await LogService.getLog(id);
    res.status(200).send(existingLog);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const createLog = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id, action, entity_type, entity_id } = req.body;
  const logRequest: CreateLogRequest = {
    user_id,
    action,
    entity_type,
    entity_id,
  };
  try {
    const newLog = await LogService.createLog(logRequest);
    res.status(201).send(newLog);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

const deleteLog = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    await LogService.deleteLog(id);
    res.status(200).send(`Deleted log ${id}`);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export { getLog, createLog, deleteLog };
