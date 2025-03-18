import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualSession.component.html',
  styleUrls: ['./individualSession.component.css'],
  imports: [CommonModule, RouterModule],
})
export class IndividualSessionComponent {
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

  students = [
    { name: 'John Doe', id: '1' },
    { name: 'Jane Smith', id: '2' },
    { name: 'Alice Johnson', id: '3' },
  ];

  sessionId: string | null = null;
  className: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.sessionId = params.get('id');
    });
    if (this.sessionId) {
      this.getSessionInfo(this.sessionId);
      this.getStudentsFromSession(this.sessionId);
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

  getStudentsFromSession(sessionId: string): void {
    this.students = [];
    var studentIds: Array<{ id: string }> = [];

    this.apiService
      .get<Array<{ id: string }>>(`session/${sessionId}/students`)
      .subscribe((response) => {
        studentIds = response;

        // Get student info
        for (let studentId of studentIds) {
          this.apiService
            .get<{ name: string; id: string }>(`student/${studentId}`)
            .subscribe((response) => {
              this.students.push(response);
            });
        }
      });
  }
}
