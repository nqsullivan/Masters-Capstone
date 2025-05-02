import { Component, DoCheck } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { AttendanceService } from './services/attendanceService.service';
import { FlaggedEventService } from './services/flaggedEvent.service';
import { AttendanceData } from './flags/flags.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements DoCheck {
  welcomeMessage: string | null = null;
  currentPageTitle: string = 'Dashboard';
  hasNewInfo: boolean = false; //indicate there are new unread flagged events
  previousUrl: boolean = false;
  flaggedRecords: AttendanceData[] = [];
  oldToReview: AttendanceData[] = [];
  constructor(
    private authService: AuthService,
    private router: Router,
    private attendanceService: AttendanceService,
    private flaggedEventService: FlaggedEventService
  ) {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        this.updatePageTitle();

        // Reset hasNewInfo when navigating to the "Flags" route
        if (event?.url === '/attendance-flags') {
          this.hasNewInfo = false;
          this.previousUrl = true;
        }

        if (this.previousUrl == true && event.url != '/attendance-flags') {
          this.hasNewInfo = false;
          this.previousUrl = false;
        }
      });
  }

  ngOnInit(): void {
    this.attendanceService.startPolling();
    //subscribe to the flaggedAttendanceRecords$ observable
    this.flaggedEventService.flaggedAttendanceRecords$.subscribe((records) => {
      this.flaggedRecords = records; // Update the local flagged records
      console.log('Flagged Attendance Records:', this.flaggedRecords);

      //retrieve flagged events to review from local storage
      const storedFlaggedRecordsToReview = localStorage.getItem(
        'flaggedAttendanceRecordsToReview'
      );
      this.oldToReview = storedFlaggedRecordsToReview
        ? JSON.parse(storedFlaggedRecordsToReview)
        : [];

      //compare oldToReview with flaggedReocrds
      if (this.hasNewInfo == false) {
        this.hasNewInfo = this.hasNewRecords(
          this.oldToReview,
          this.flaggedRecords
        );
      }

      localStorage.setItem(
        'flaggedAttendanceRecordsToReview',
        JSON.stringify(this.flaggedRecords)
      );
    });
    // this.flaggedEventService.startPollingFlaggedAttendance();
  }

  ngDoCheck(): void {
    if (this.authService.getUsername() !== null) {
      this.welcomeMessage = `Hello, ${this.authService.getUsername()}`;
    }
  }
  private updatePageTitle(): void {
    const route = this.router.routerState.snapshot.root.firstChild;
    this.currentPageTitle = route?.data['title'] || 'Dashboard';
  }

  logout(): void {
    this.welcomeMessage = null;
    this.hasNewInfo = false;
    this.authService.logout();
  }

  // check if there are new records to review
  private hasNewRecords(
    records1: AttendanceData[],
    records2: AttendanceData[]
  ): boolean {
    const record1Ids = new Set(records1.map((record) => record.id)); // Create a set of IDs from records1

    return records2.some((record) => !record1Ids.has(record.id));
  }
}
