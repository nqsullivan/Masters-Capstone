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
export class IndividualStudentComponent {

  studentInfo = {
      "id": "a0f4b0bf-d8e2-481c-a3b1-1e9764736c55",
      "name": "Student 603",
      "image": "https://randomuser.me/api/portraits/men/47.jpg"
  }
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
   
  }
}
