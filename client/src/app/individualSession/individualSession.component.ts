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
import { AttendanceService } from '../services/attendanceService.service';

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
  dataSource = new MatTableDataSource<AttendanceData>([]);

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
    private apiService: ApiService,
    private attendanceService: AttendanceService
  ) {}

  selectedElement: AttendanceData | null = null;
  readonly checkInTime = signal('');
  readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.sessionId = params.get('id');
      if (this.sessionId) {
        this.getSessionInfo(this.sessionId);
      }
    });

    this.attendanceService.attendance$.subscribe((newData) => {
      if (!newData || !this.sessionId) return;

      const filtered = newData.filter(
        (record) => record.sessionId === this.sessionId
      );

      let didChange = false;

      for (const newRecord of filtered) {
        const existing = this.attendances.find((a) => a.id === newRecord.id);

        const stripUrl = (url: string) => decodeURIComponent(url.split('?')[0]);

        if (
          !existing ||
          existing.checkIn !== newRecord.checkIn ||
          stripUrl(existing.portraitUrl) !== stripUrl(newRecord.portraitUrl)
        ) {
          didChange = true;

          const enriched: AttendanceData = {
            ...newRecord,
            studentName: '',
          };

          if (existing) {
            Object.assign(existing, enriched);
          } else {
            this.attendances.push(enriched);
          }
        }
      }

      if (didChange) {
        this.dataSource.data = [...this.attendances];
        this.resolveVisibleMetadata();
      }
    });

    this.resolveVisibleMetadata();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.resolveVisibleMetadata();

    this.paginator.page.subscribe(() => {
      this.resolveVisibleMetadata();
    });
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

        this.apiService.get(`session/${sessionId}/attendance`);
      });
  }

  resolveVisibleMetadata(): void {
    if (!this.paginator || !this.dataSource?.data) return;

    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;

    const visibleRows = this.dataSource.data.slice(startIndex, endIndex);

    for (let record of visibleRows) {
      if (!record.studentName) {
        this.apiService
          .get<{ name: string }>(`student/${record.studentId}`)
          .subscribe((res) => (record.studentName = res.name));
      }

      if (record.portraitUrl.includes('amazonaws.com')) {
        const index = record.portraitUrl.indexOf('amazonaws.com');
        const key = record.portraitUrl.slice(index + 'amazonaws.com/'.length);
        this.apiService
          .get<{ imageUrl: string }>(`image/${key}`)
          .subscribe((res) => (record.portraitUrl = res.imageUrl));
      }
    }
  }

  editAttendance(
    checkInTime: string | null,
    attendanceData: AttendanceData
  ): void {
    if (attendanceData) {
      if (checkInTime == '') {
        checkInTime = null;
      }

      this.apiService
        .put(`session/${this.sessionId}/attendance/${attendanceData.id}`, {
          checkInTime: checkInTime,
        })
        .subscribe({
          next: () => {
            this.attendanceService.refreshNow();
          },
          error: (result) => {
            alert(result.error.error);
          },
        });
    }
  }

  edit() {
    const dialogRef = this.dialog.open(EditAttendanceDialog, {
      width: '500px',
      data: {
        checkInTime: this.checkInTime(),
        selectedElement: this.selectedElement,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
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
