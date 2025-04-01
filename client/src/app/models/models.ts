export interface Class {
  id: string;
  name: string;
}

export interface Session {
  id: string;
  startTime: string;
  endTime: string;
  classId: string;
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
  portraitUrl: string;
  portraitCaptured: boolean;
}

export interface DashboardData {
  class: Class;
  professor: string;
  students: Student[];
  sessions: Session[];
  attendance: Map<string, AttendanceRecord[]>; // sessionId -> AttendanceRecord[]
}

export interface ClassListData {
  classes: Class[];
}
