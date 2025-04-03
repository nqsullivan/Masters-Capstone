import { Component, QueryList, ViewChildren, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  MatDialog,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Session, Student } from '../models/models';

import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';

interface DialogData {
  image: string;
  id: string;
  name: string;
}

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualStudent.component.html',
  styleUrls: ['./individualStudent.component.css'],
  imports: [
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatMenuModule,
  ],
})
export class IndividualStudentComponent {
  studentId: string | null = null;

  studentInfo = {
    id: '',
    name: '',
    image: '',
  };
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.studentId = params.get('id');
    });
    if (this.studentId) {
      this.getStudentInfo(this.studentId);
    }
  }

  getStudentInfo(studentId: string): void {
    this.apiService
      .get<{ id: string; name: string; image: string }>(`student/${studentId}`)
      .subscribe((response) => {
        let imageKey = '';
        // Check if the image URL starts with "https://team-5-capstone-25"
        if (response.image.startsWith('https://team-5-capstone-25')) {
          //the image key is the last part of the URL
          imageKey = response.image.split('/').pop() ?? '';
          if (imageKey) {
            this.retrieveImage(imageKey);
          } else {
            console.error('Image key is undefined');
          }
        } else {
          //this is for test data
          this.studentInfo.image = response.image;
        }
        this.studentInfo.id = response.id;
        this.studentInfo.name = response.name;
      });
  }

  retrieveImage(imageKey: string): void {
    this.apiService.get<{ imageUrl: string }>(`image/${imageKey}`).subscribe({
      next: (response) => {
        console.log('Retrieved image URL:', response.imageUrl);
        this.studentInfo.image = response.imageUrl;
      },
      error: (error) => {
        console.error('Error retrieving image:', error);
      },
    });
  }

  openDialog(): void {
    console.log('Opening dialog');
    const dialogRef = this.dialog.open(EditStudentDialogComponent, {
      width: '500px',
      data: { ...this.studentInfo },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.studentInfo.name = result.name; // Update the student info with the result, so the UI updates without a refresh
      }
    });
  }

  deleteStudent(studentId: string): void {
    this.apiService
      .delete<{ message: string }>(`student/${studentId}`)
      .subscribe({
        next: (response) => {
          console.log('Student deleted successfully:', response.message);

          this.studentInfo = {
            id: '',
            name: '',
            image: '',
          };
        },
        error: (error) => {
          console.error('Error deleting student:', error);
        },
        complete: () => {
          console.log('Delete student request completed.');
        },
      });
  }
}

@Component({
  selector: 'app-edit-student-dialog',
  templateUrl: './edit-student-dialog.html',
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
    CommonModule,
  ],
})
export class EditStudentDialogComponent {
  updatedStudentInfo: { id: string; name: string; image: string };

  data = inject<DialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<EditStudentDialogComponent>);

  constructor(private apiService: ApiService) {}

  imageFormControl = new FormControl(this.data.image, [Validators.required]);
  studentIdFormControl = new FormControl(this.data.id, [Validators.required]);
  nameFormControl = new FormControl(this.data.name, [Validators.required]);

  matcher = new MyErrorStateMatcher();
  onNoClick(): void {
    this.dialogRef.close();
  }
  save(): void {
    {
      this.updateStudent(this.studentIdFormControl.value ?? '', {
        name: this.nameFormControl.value ?? '',
        image: this.imageFormControl.value ?? '',
      });
      console.log('Updated student:', this.updatedStudentInfo);
      //refresh the page
      window.location.reload();
    }
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected file name:', file.name);

      const fileName = file.name;

      this.imageFormControl.setValue(fileName);

      const formData = new FormData();
      formData.append('image', file);

      this.uploadFile(formData);
    }
  }

  uploadFile(formData: FormData): void {
    this.apiService
      .post<{ message: { fileUrl: string } }>('image', formData)
      .subscribe({
        next: (response) => {
          console.log('File uploaded successfully:', response);
          this.imageFormControl.setValue(response.message.fileUrl);
        },
        error: (error) => {
          console.error('Error uploading file:', error);
        },
      });
  }

  updateStudent(
    studentId: string,
    updatedData: { name: string; image: string }
  ): void {
    this.apiService
      .put<{
        id: string;
        name: string;
        image: string;
      }>(`student/${studentId}`, updatedData)
      .subscribe({
        next: (response) => {
          console.log('Student updated successfully:', response);
          this.updatedStudentInfo = response; // Update the local student info with the response
        },
        error: (error) => {
          console.error('Error updating student:', error);
        },
        complete: () => {
          console.log('Update student request completed.');
        },
      });
  }
}

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
