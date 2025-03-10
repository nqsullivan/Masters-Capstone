import e, { Request, Response, NextFunction } from 'express';
import { DashboardData } from '../models/dashboardData.js';
import { buildDashboardData } from '../services/dashboard.js';

const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { classId } = req.params;
  try {
    const dashboardData: DashboardData = await buildDashboardData(classId);

    res.status(200).send(dashboardData);
    next();
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

export { getDashboardData };
