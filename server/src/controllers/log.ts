import { Request, Response, NextFunction } from 'express';
import { CreateLogRequest } from '../models/logRequest.js';
import LogService from '../services/log.js';

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
  const { userId, action, entity_type, entityId } = req.body;
  const logRequest: CreateLogRequest = {
    userId,
    action,
    entity_type,
    entityId,
  };
  const newLog = await LogService.createLog(logRequest);
  res.status(201).send(newLog);
  next();
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

const getLogsPaginated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page: number = parseInt(req.query.page as string) || 1;
  const size: number = parseInt(req.query.size as string) || 10;
  try {
    const logPage = await LogService.getLogPage(page, size);
    res.status(200).send(logPage);
    next();
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export { getLog, createLog, deleteLog, getLogsPaginated };
