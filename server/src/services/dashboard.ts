import { DashboardData } from '../models/dashboardData.js';
import { Class } from '../models/class.js';
import ClassService from './class.js';
import StudentClassAssignmentService from '../services/studentClassAssignment.js';
import SessionService from './session.js';
import StudentService from './student.js';
import UserClassAssignmentService from '../services/userClassAssignment.js';
import { Student } from '../models/student.js';
import { Attendance } from '../models/attendance.js';
import { Session } from '../models/session.js';

export const buildDashboardData = async (
  classId: string
): Promise<DashboardData> => {
  const classData: Class = await ClassService.getClass(classId);
  const professorUsernames: string[] = (
    await UserClassAssignmentService.getProfessorsForClass(classId)
  ).map((professor) => professor.username);
  const studentIds: string[] =
    await StudentClassAssignmentService.getStudentsForClass(classId);
  const students: Student[] = await StudentService.getStudents(studentIds);
  const sessions: Session[] = await ClassService.getSessionsForClass(classId);
  const attendance: Map<string, Attendance[]> =
    await SessionService.getAttendanceRecordsForSessions(
      sessions.map((session) => session.id)
    );

  return {
    class: classData,
    professors: professorUsernames,
    students,
    sessions,
    attendance,
  };
};
