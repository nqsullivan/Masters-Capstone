import { Injectable } from '@angular/core';
import { BehaviorSubject, timer, EMPTY, firstValueFrom } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AttendanceData } from '../flags/flags.component';
import { ApiService } from './api.service';

// this service is used to retrive flagged attendance records repeatedly.

@Injectable({
  providedIn: 'root',
})
export class FlaggedEventService {
  private readonly POLL_INTERVAL = 1000;

  private flaggedAttendanceRecordsSubject = new BehaviorSubject<
    AttendanceData[]
  >([]);
  flaggedAttendanceRecords$ =
    this.flaggedAttendanceRecordsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Start polling flagged attendance data
  startPollingFlaggedAttendance(): void {
    timer(0, this.POLL_INTERVAL)
      .pipe(
        switchMap(() =>
          this.getFlaggedAttendanceData().then((records) => {
            this.flaggedAttendanceRecordsSubject.next(records);
            return EMPTY;
          })
        ),
        catchError((err) => {
          console.error('Polling error:', err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  // Refresh flagged attendance data immediately
  refreshFlaggedAttendanceNow(): void {
    this.getFlaggedAttendanceData().then((records) => {
      this.flaggedAttendanceRecordsSubject.next(records);
    });
  }

  // Fetch flagged attendance data from the API
  private async getFlaggedAttendanceData(): Promise<AttendanceData[]> {
    const pageSize = 100;
    const result = await firstValueFrom(
      this.apiService.get<{ data: AttendanceData[] }>(
        `attendance?isFlagged=true`
      )
    );

    // Filter records where status is null or an empty string and flagged is true
    const filteredRecords = result.data.filter(
      (record) =>
        record.flagged && (record.status === null || record.status === '')
    );

    return filteredRecords;
  }
}
