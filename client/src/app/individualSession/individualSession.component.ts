import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';

interface AttendanceData {
  id: string;
  studentId: string;
  studentName: string;
  portraitUrl: string;
  portraitCaptured: boolean;
  checkIn: string;
  sessionId: string;
}

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualSession.component.html',
  styleUrls: ['./individualSession.component.css'],
  imports: [
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
  ],
})
export class IndividualSessionComponent {
  displayedColumns: string[] = ['checkInTime', 'photo', 'name'];
  dataSource: MatTableDataSource<AttendanceData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  sessionInfo: {
    id: string;
    startTime: string;
    endTime: string;
    classId: string;
    professorId: string;
    className: string;
  } = {
    id: '',
    startTime: '',
    endTime: '',
    classId: '',
    professorId: '',
    className: '',
  };

  attendances: AttendanceData[] = [];

  sessionId: string | null = null;
  className: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.sessionId = params.get('id');
    });
    if (this.sessionId) {
      this.getSessionInfo(this.sessionId);
      this.getAttendances(this.sessionId);
    }
  }
  getSessionInfo(sessionId: string): void {
    this.apiService
      .get<{
        id: string;
        startTime: string;
        endTime: string;
        classId: string;
        professorId: string;
      }>(`session/${sessionId}`)
      .subscribe((response) => {
        this.sessionInfo.id = response.id;
        this.sessionInfo.startTime = response.startTime;
        this.sessionInfo.endTime = response.endTime;
        this.sessionInfo.professorId = response.professorId;
        this.sessionInfo.classId = response.classId;

        this.apiService
          .get<{ id: string; name: string }>(`class/${response.classId}`)
          .subscribe((response) => {
            this.sessionInfo.className = response.name;
          });
      });
  }

  getAttendances(sessionId: string): void {
    this.attendances = [];
    this.apiService
      .get<{
        [key: string]: Array<{
          id: string;
          studentId: string;
          sessionId: string;
          checkIn: string;
          portraitUrl: string;
          portraitCaptured: boolean;
        }>;
      }>(`session/${sessionId}/attendance`)
      .subscribe((response) => {
        for (let entry of response[sessionId]) {
          let attendanceRecord = {
            id: entry.id,
            studentId: entry.studentId,
            studentName: '',
            portraitUrl: entry.portraitUrl,
            portraitCaptured: entry.portraitCaptured,
            checkIn: entry.checkIn,
            sessionId: entry.sessionId,
          };
          this.apiService
            .get<{ name: string; id: string }>(`student/${entry.studentId}`)
            .subscribe((response) => {
              attendanceRecord['studentName'] = response.name;
            });

          if (entry.portraitUrl.includes('amazonaws.com')) {
            const index = entry.portraitUrl.indexOf('amazonaws.com');
            entry.portraitUrl = entry.portraitUrl.slice(
              index + 'amazonaws.com/'.length
            );
          }

          this.apiService
            .get<{ imageUrl: string }>(`image/${entry.portraitUrl}`)
            .subscribe((response) => {
              attendanceRecord['portraitUrl'] = response['imageUrl'];
            });

          this.attendances.push(attendanceRecord);
        }
        // Assign the data to the data source for the table to render
        this.dataSource = new MatTableDataSource(this.attendances);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
