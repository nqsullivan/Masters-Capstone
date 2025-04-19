import { Request, Response, NextFunction } from 'express';
import SessionService from '../services/session.js';

const getAttendanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const attendance = await SessionService.getAttendanceRecord(id);
      
      res.status(200).send(attendance);
    } catch (e: any) {
      if (e.message === 'Attendance record not found') {
        res.status(404).json({ error: e.message });
      } else {
        console.error(e);
        res.status(400).json({ error: e.message });
      }
    } finally {
      next();
    }
  };

  export {
    getAttendanceRecord
  }