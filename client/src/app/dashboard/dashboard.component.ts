import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AuthService } from '../services/auth.service';
import {
  Class,
  Student,
  AttendanceRecord,
  DashboardData,
} from '../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  classes: Class[] = [];
  selectedClass: string = '';
  dashboardData: DashboardData | undefined;

  lastClassAttendance: { name: string; value: number }[] = [];
  attendanceOverTime: {
    name: string;
    series: { name: string; value: number }[];
  }[] = [];
  studentList: (Student & { totalClasses: number; classesAttended: number })[] =
    [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    const username = this.authService.getUsername();
    if (!username) {
      console.error('No username found in AuthService');
      return;
    }

    this.apiService
      .get<{data: Class[]}>(`classes`)
      .subscribe((data) => {
        this.classes = data.data;
        this.selectedClass = this.classes[0].id;
        this.loadDashboardData();
      });
  }

  loadDashboardData(): void {
    this.apiService
      .get<DashboardData>(`dashboard/${this.selectedClass}`)
      .subscribe((data) => {
        this.dashboardData = data;
        this.processAttendanceData();
      });
  }

  processAttendanceData(): void {
    if (!this.dashboardData) return;

    const attendance: Map<string, AttendanceRecord[]> = new Map(
      Object.entries(this.dashboardData.attendance)
    );
    const sessions = this.dashboardData.sessions;

    const lastSessionId = sessions[sessions.length - 1]?.id;
    if (lastSessionId && attendance.get(lastSessionId)) {
      this.lastClassAttendance = this.processLastClassAttendance(
        attendance.get(lastSessionId)!
      );
    }

    this.attendanceOverTime = this.processAttendanceOverTime(attendance);

    this.calculateStudentAttendanceStats(attendance);
  }

  private processLastClassAttendance(
    data: AttendanceRecord[]
  ): { name: string; value: number }[] {
    const counts: Record<string, number> = { Present: 0, Absent: 0, Late: 0 };

    const presentStudents = new Set<string>();

    data.forEach((record) => {
      presentStudents.add(record.studentId);
    });

    if (this.dashboardData) {
      this.dashboardData.students.forEach((student) => {
        if (!presentStudents.has(student.id)) {
          counts['Absent']++;
        } else {
          counts['Present']++;
        }
      });
    }

    return Object.keys(counts).map((status) => ({
      name: status,
      value: counts[status],
    }));
  }

  private processAttendanceOverTime(
    attendance: Map<string, AttendanceRecord[]>
  ): { name: string; series: { name: string; value: number }[] }[] {
    const attendanceByDate: Record<string, number> = {};

    attendance.forEach((sessionRecords) => {
      sessionRecords.forEach((record: AttendanceRecord) => {
        const date = new Date(record.checkIn).toISOString().split('T')[0];

        attendanceByDate[date] = (attendanceByDate[date] || 0) + 1;
      });
    });

    const seriesData = Object.keys(attendanceByDate).map((date) => ({
      name: date,
      value: attendanceByDate[date],
    }));

    return [{ name: 'Attendance', series: seriesData }];
  }

  private calculateStudentAttendanceStats(
    attendance: Map<string, AttendanceRecord[]>
  ): void {
    const studentAttendance: Map<string, { attended: number }> = new Map();

    attendance.forEach((sessionRecords) => {
      sessionRecords.forEach((record: AttendanceRecord) => {
        if (!studentAttendance.get(record.studentId)) {
          studentAttendance.set(record.studentId, { attended: 0 });
        }
        studentAttendance.get(record.studentId)!.attended++;
      });
    });

    const totalClasses = this.dashboardData?.sessions.length || 0;

    this.studentList = this.dashboardData!.students.map((student: Student) => ({
      ...student,
      totalClasses,
      classesAttended: studentAttendance.get(student.id)?.attended || 0,
    }));
  }

  onClassChange(): void {
    this.loadDashboardData();
  }
}
