/**
 * Sourced from https://material.angular.io/components/table/examples
 */

import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../services/api.service';
import { Class } from '../models/models';
import { RouterModule } from '@angular/router';

export interface ClassListData {
  id: string;
  name: string;
}

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-class-list',
  styleUrl: './class-list.component.css',
  templateUrl: './class-list.component.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    RouterModule,
  ],
})
export class ClassListComponent {
  displayedColumns: string[] = ['id', 'name'];
  dataSource: MatTableDataSource<ClassListData>;
  classes: Class[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private apiService: ApiService) {
    this.apiService.get<{ data: Class[] }>('classes').subscribe((data) => {
      this.classes = data.data;

      // Assign the data to the data source for the table to render
      this.dataSource = new MatTableDataSource(this.classes);
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
