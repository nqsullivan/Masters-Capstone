import { Component, QueryList, ViewChildren } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Session, Student } from '../models/models';

export interface SessionListData {
  id: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualClass.component.html',
  styleUrls: ['./individualClass.component.css'],
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
export class IndividualClassComponent {
  sessionsDisplayedColumns: string[] = ['ID', 'Start Time', 'End Time'];
  sessionsDataSource: MatTableDataSource<Session>;

  studentsDisplayedColumns: string[] = ['Name', 'ID'];
  studentsDataSource: MatTableDataSource<Student>;

  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();

  sessionInfo: Session[] = [];
  students: Student[] = [];

  classId: string | null = null;
  className: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.classId = params.get('id');
    });
    if (this.classId) {
      this.getClassInfo(this.classId);
      this.getAllSessions(this.classId);
      this.getStudetsFromClass(this.classId);
    }
  }

  getClassInfo(classId: string): void {
    this.apiService
      .get<{ id: string; name: string }>(`class/${classId}`)
      .subscribe((response) => {
        this.className = response.name;
      });
  }

  getAllSessions(classId: string): void {
    this.apiService
      .get<
        Array<{
          id: string;
          startTime: string;
          endTime: string;
          classId: string;
          professorId: string;
        }>
      >(`class/${classId}/sessions`)
      .subscribe((response) => {
        this.sessionInfo = response;
        this.sessionsDataSource = new MatTableDataSource(this.sessionInfo);
        this.sessionsDataSource.paginator = this.paginator.toArray()[0];
        this.sessionsDataSource.sort = this.sort.toArray()[0];
      });
  }

  getStudetsFromClass(classId: string): void {
    this.students = [];
    var studentIds: Array<{ id: string }> = [];

    this.apiService
      .get<Array<{ id: string }>>(`class/${classId}/students`)
      .subscribe((response) => {
        studentIds = response;

        // Get student info
        for (let studentId of studentIds) {
          console.log(studentId);

          this.apiService
            .get<{
              name: string;
              id: string;
              image: string;
            }>(`student/${studentId}`)
            .subscribe((response) => {
              this.students.push(response);
              this.studentsDataSource = new MatTableDataSource(this.students);
              this.studentsDataSource.paginator = this.paginator.toArray()[1];
              this.studentsDataSource.sort = this.sort.toArray()[1];
            });
        }
      });
  }

  applySessionFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.sessionsDataSource.filter = filterValue.trim().toLowerCase();

    if (this.sessionsDataSource.paginator) {
      this.sessionsDataSource.paginator.firstPage();
    }
  }

  applyStudentsFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.studentsDataSource.filter = filterValue.trim().toLowerCase();

    if (this.studentsDataSource.paginator) {
      this.studentsDataSource.paginator.firstPage();
    }
  }
}
