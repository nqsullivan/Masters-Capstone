export interface Class {
  id: string;
  name: string;
}

export interface Session {
  id: string;
  startTime: string;
  endTime: string;
  classId: string;
  professorId: string;
}

export interface Student {
  id: string;
  name: string;
  image: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  checkIn: string;
  portaitUrl: string;
  portaitCaptured: boolean;
}

export interface DashboardData {
  class: Class;
  professor: string;
  students: Student[];
  sessions: Session[];
  attendance: Map<string, AttendanceRecord[]>; // sessionId -> AttendanceRecord[]
}
