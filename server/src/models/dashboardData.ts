import { Class } from './class.js';
import { Student } from './student.js';
import { Session } from './session.js';
import { Attendance } from './attendance.js';

export interface DashboardData {
  class: Class;
  professors: string[];
  students: Student[];
  sessions: Session[];
  attendance: Map<string, Attendance[]>; // sessionId -> Attendance[]
}
