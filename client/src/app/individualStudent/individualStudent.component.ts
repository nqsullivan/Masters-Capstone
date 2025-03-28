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
    private apiService: ApiService
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
}
