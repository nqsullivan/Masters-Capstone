export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  sessionId: string;
  checkIn: string | null;
  portraitUrl: string;
  portraitCaptured: boolean;
  FRIdentifiedId: string | null;
  status: string | null;
  flagged: boolean;
}
