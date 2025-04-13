import { Component, ViewChild, inject, model, signal } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
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

interface AttendanceData {
  id: string;
  studentId: string;
  studentName: string;
  portraitUrl: string;
  portraitCaptured: boolean;
  checkIn: string;
  sessionId: string;
}

interface DialogData {
  checkInTime: string;
  selectedElement: AttendanceData;
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
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class IndividualSessionComponent {
  displayedColumns: string[] = [
    'didCheckIn',
    'checkInTime',
    'photo',
    'name',
    'actions',
  ];
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

  selectedElement: AttendanceData | null = null;
  readonly checkInTime = signal('');
  readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.sessionId = params.get('id');
    });
    if (this.sessionId) {
      this.getSessionInfo(this.sessionId);
      this.reloadAttendanceData();
    }
  }

  reloadAttendanceData() {
    if (this.sessionId) {
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

  editAttendance(
    checkInTime: string | null,
    attendanceData: AttendanceData
  ): void {
    console.log(checkInTime);
    console.log(attendanceData);
    if (attendanceData) {
      console.log('Entered if block');
      if (checkInTime == '') {
        checkInTime = null;
      }

      this.apiService
        .put(`session/${this.sessionId}/attendance/${attendanceData.id}`, {
          checkInTime: checkInTime,
        })
        .subscribe({
          next: () => {
            this.reloadAttendanceData();
          },
          error: (result) => {
            alert(result.error.error);
          },
        });
    }
  }

  edit() {
    console.log('edit =>', this.selectedElement);
    const dialogRef = this.dialog.open(EditAttendanceDialog, {
      width: '500px',
      data: {
        checkInTime: this.checkInTime(),
        selectedElement: this.selectedElement,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
      if (result !== undefined) {
        console.log(result);
        this.editAttendance(result.checkInTime, result.selectedElement);
      }
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

/** https://material.angular.io/components/dialog/overview */
@Component({
  selector: 'edit-attendance-dialog',
  templateUrl: 'edit-attendance-dialog.html',
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
export class EditAttendanceDialog {
  readonly dialogRef = inject(MatDialogRef<EditAttendanceDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly checkInTime = model(this.data.checkInTime);

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkInTimeFormControl = new FormControl('');
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
