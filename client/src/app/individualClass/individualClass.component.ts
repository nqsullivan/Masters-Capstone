import { Component } from '@angular/core';

@Component({
  selector: 'app-class-dashboard',
  templateUrl: './individualClass.component.html',
  styleUrls: ['./individualClass.component.css']
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
}