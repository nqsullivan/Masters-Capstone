import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualClass.component.html',
  styleUrls: ['./individualClass.component.css'],
  imports: [CommonModule, RouterModule],
})
export class IndividualClassComponent {
  sessionInfo: Array<{
    id: string;
    startTime: string;
    endTime: string;
    professorId: string;
  }> = [];

  students = [
    { name: 'John Doe', id: '1' },
    { name: 'Jane Smith', id: '2' },
    { name: 'Alice Johnson', id: '3' },
  ];

  classId: string | null = null;
  className: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
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
    /*this.http
        .get<{
            id: String;
            name: string;
        }>(`http://localhost:3000/class/${classId}`)
        .subscribe((response) => {
            this.className = response.name;
        });*/

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
            .get<{ name: string; id: string }>(`student/${studentId}`)
            .subscribe((response) => {
              this.students.push(response);
            });
        }
      });
  }
}
