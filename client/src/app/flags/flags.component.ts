import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { Component, ViewChildren, QueryList } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AttendanceRecord } from '../models/models';
import { HttpResponseBase } from '@angular/common/http';

interface AttendanceData {
  id: string;
  studentId: string;
  studentName: string;
  FRIdentifiedId: string;
  checkInTime: string;
  status: string;
  flagged: boolean;
}

@Component({
  selector: 'flags.component',
  imports: [
    MatTab,
    MatTabGroup,
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './flags.component.html',
  styleUrls: ['./flags.component.css'],
})
export class FlagsComponent {
  displayedColumns: string[] = [
    'AttendanceId',
    'Name',
    'ScannedId',
    'FaceRecognitionId',
    'CheckInTime',
    'Actions',
  ];

  flaggedDataSource: MatTableDataSource<AttendanceData>;
  escalatedDataSource: MatTableDataSource<AttendanceData>;

  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();

  selectedElement: AttendanceData | null = null;
  flaggedAttendanceRecordsToReview: AttendanceData[] = [];
  escalatedAttendanceRecordsToReview: AttendanceData[] = [];

  constructor(private apiService: ApiService) {}

  selectedTabIndex = 0;

  ngOnInit(): void {
    const savedIndex = localStorage.getItem('flags-selected-tab');
    this.selectedTabIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
    this.getFlaggedAttendanceData();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    localStorage.setItem('flags-selected-tab', index.toString());
  }


  getFlaggedAttendanceData() {
    this.flaggedAttendanceRecordsToReview = [];
    this.escalatedAttendanceRecordsToReview = [];
    this.apiService.get<{ data: AttendanceRecord[] }>(`attendance`).subscribe({
      next: (response) => {
        let attendance = response.data;
        attendance.forEach((attendance) => {
          let attendanceRecord: AttendanceData = {
            id: attendance.id,
            studentId: attendance.studentId,
            studentName: attendance.studentName,
            FRIdentifiedId: attendance.FRIdentifiedId,
            checkInTime: attendance.checkIn,
            status: attendance.status || '',
            flagged: attendance.flagged,
          };

          if (attendanceRecord.flagged && attendanceRecord.status === '') {
            this.flaggedAttendanceRecordsToReview.push(attendanceRecord);
          }

          if (attendanceRecord.status === 'ESCALATED') {
            this.escalatedAttendanceRecordsToReview.push(attendanceRecord);
          }
        });

        this.flaggedDataSource = new MatTableDataSource(
          this.flaggedAttendanceRecordsToReview
        );
        this.flaggedDataSource.paginator = this.paginator.toArray()[0];
        this.flaggedDataSource.sort = this.sort.toArray()[0];

        this.escalatedDataSource = new MatTableDataSource(
          this.escalatedAttendanceRecordsToReview
        );
        this.escalatedDataSource.paginator = this.paginator.toArray()[1];
        this.escalatedDataSource.sort = this.sort.toArray()[1];
      },
    });
  }

  handleEscalate() {
    let data = {
      status: 'ESCALATED',
    };
    this.putAttendanceRequest(data);
  }

  handleDeEscalate() {
    let data = {
      status: '',
    };
    this.putAttendanceRequest(data);
  }

  handleDimiss() {
    let data = {
      status: 'DISMISSED',
    };
    this.putAttendanceRequest(data);
  }

  putAttendanceRequest(data: { status: string }) {
    this.apiService
      .put<HttpResponseBase>(`attendance/${this.selectedElement?.id}`, data)
      .subscribe({
        next: () => {
          this.getFlaggedAttendanceData();
        },
      });
  }

  applyFlaggedFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.flaggedDataSource.filter = filterValue.trim().toLowerCase();

    if (this.flaggedDataSource.paginator) {
      this.flaggedDataSource.paginator.firstPage();
    }
  }

  applyEscalatedFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.escalatedDataSource.filter = filterValue.trim().toLowerCase();

    if (this.escalatedDataSource.paginator) {
      this.escalatedDataSource.paginator.firstPage();
    }
  }
}
