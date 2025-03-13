import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualClass.component.html',
  styleUrls: ['./individualClass.component.css'],
  imports: [CommonModule]
})

export class IndividualClassComponent {
    sessionInfo = {
        id: '12345',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        professorId: '67890'
    };

    students = [
        { name: 'John Doe', id: '1' },
        { name: 'Jane Smith', id: '2' },
        { name: 'Alice Johnson', id: '3' }
    ];

    classId: string | null = null;

    constructor(private route: ActivatedRoute) {}
  
    ngOnInit(): void {
      this.route.paramMap.subscribe(params => {
        this.classId = params.get('id');
      });
    }
}