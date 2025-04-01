import { Component, QueryList, ViewChildren, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
        this.studentInfo = {
          id: response.id,
          name: response.name,
          image: response.image,
        };
      });
  }

  openDialog(): void {
    console.log('Opening dialog');
    const dialogRef = this.dialog.open(EditStudentDialogComponent, {
      width: '400px',
      data: { ...this.studentInfo },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.studentInfo = result; // Update the student info with the result, so the UI updates without a refresh
        console.log('Updated Student Info:', this.studentInfo);
      }
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
  this.apiService.post('image', formData).subscribe({
    next: (response) => {
      console.log('File uploaded successfully:', response);
    },
    error: (error) => {
      console.error('Error uploading file:', error);
    },
  });
}

updateStudent(studentId: string, updatedData: { name: string; image: string }): void {
  this.apiService
    .put<{ id: string; name: string; image: string }>(`student/${studentId}`, updatedData)
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
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}