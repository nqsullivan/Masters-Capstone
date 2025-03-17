
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class AttendanceComponent implements OnInit {
  id: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Retrieve the 'id' parameter from the route
    this.id = this.route.snapshot.paramMap.get('id');
    console.log('Attendance ID:', this.id); // For debugging
  }
}
