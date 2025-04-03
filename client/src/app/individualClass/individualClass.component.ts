import {
  ChangeDetectionStrategy,
  Component,
  QueryList,
  ViewChildren,
  inject,
  model,
  signal,
} from '@angular/core';
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
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { HttpResponseBase } from '@angular/common/http';

export interface DialogData {
  studentId: string;
}

export interface SessionTableData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualClass.component.html',
  styleUrls: ['./individualClass.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
  ],
})
export class IndividualClassComponent {
  sessionsDisplayedColumns: string[] = ['Date', 'Start Time', 'End Time'];
  sessionsDataSource: MatTableDataSource<SessionTableData>;

  studentsDisplayedColumns: string[] = ['Name', 'ID'];
  studentsDataSource: MatTableDataSource<Student>;

  @ViewChildren(MatPaginator) paginator = new QueryList<MatPaginator>();
  @ViewChildren(MatSort) sort = new QueryList<MatSort>();

  students: Student[] = [];

  classId: string | null = null;
  className: string | null = null;

  readonly studentId = signal('');
  readonly dialog = inject(MatDialog);
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
        }>
      >(`class/${classId}/sessions`)
      .subscribe((response) => {
        let sessionInfo: Session[] = response;
        let transformedSessionInfo: SessionTableData[] =
          this.transformIncomingSessionInfo(sessionInfo);
        this.sessionsDataSource = new MatTableDataSource(
          transformedSessionInfo
        );
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

  addStudentToClass(studentIds: string[]) {
    let data = {
      studentIds: studentIds,
    };
    this.apiService
      .post<HttpResponseBase>(`class/${this.classId}/students`, data)
      .subscribe({
        next: () => {
          // Refresh students table
          if (this.classId) {
            console.log('REFRESH ROUTE');
            this.getStudetsFromClass(this.classId);
          }
        },
        error: () => {
          console.log('ERROR ROUTE');
        },
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

  openDialog(): void {
    const dialogRef = this.dialog.open(AddStudentDialog, {
      width: '500px',
      data: { studentId: this.studentId() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
      if (result !== undefined) {
        console.log(result);
        this.addStudentToClass([result.studentId]);
      }
    });
  }

  transformIncomingSessionInfo(sessionInfo: Session[]): SessionTableData[] {
    let transformedSessionInfo: SessionTableData[] = [];

    sessionInfo.forEach((sessionInfo) => {
      transformedSessionInfo.push({
        id: sessionInfo.id,
        date: sessionInfo.startTime.split(' ')[0],
        startTime: sessionInfo.startTime.split(' ')[1],
        endTime: sessionInfo.endTime.split(' ')[1],
      });
    });
    return transformedSessionInfo;
  }
}

/** https://material.angular.io/components/dialog/overview */
@Component({
  selector: 'add-student-dialog',
  templateUrl: 'add-student-dialog.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})
export class AddStudentDialog {
  readonly dialogRef = inject(MatDialogRef<AddStudentDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly studentId = model(this.data.studentId);

  onNoClick(): void {
    this.dialogRef.close();
  }

  studentIdFormControl = new FormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();
}

/** https://material.angular.io/components/input/examples */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}
