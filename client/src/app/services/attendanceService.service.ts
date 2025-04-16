import { Injectable } from '@angular/core';
import { BehaviorSubject, timer, EMPTY, firstValueFrom } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AttendanceRecord, AttendancePage } from '../models/models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly POLL_INTERVAL = 2000;

  private attendanceSubject = new BehaviorSubject<AttendanceRecord[] | null>(
    null
  );
  attendance$ = this.attendanceSubject.asObservable();

  constructor(private apiService: ApiService) {}

  startPolling(): void {
    timer(0, this.POLL_INTERVAL)
      .pipe(
        switchMap(() =>
          this.getAllAttendanceRecords().then((records) => {
            this.attendanceSubject.next(records);
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

  refreshNow(): void {
    this.getAllAttendanceRecords().then((records) => {
      this.attendanceSubject.next(records);
    });
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    const pageSize = 100;
    let page = 1;
    let allRecords: AttendanceRecord[] = [];
    let hasMore = true;

    while (hasMore) {
      const result = await firstValueFrom(
        this.apiService.get<AttendancePage>(
          `attendance?page=${page}&size=${pageSize}`
        )
      );

      allRecords = allRecords.concat(result.data);
      page++;
      hasMore = page <= result.totalPages;
    }

    return allRecords;
  }
}
