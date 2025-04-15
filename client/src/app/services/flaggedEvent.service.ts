import { Injectable } from '@angular/core';
import { AttendanceData } from '../flags/flags.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlaggedEventService {
  private flaggedAttendanceRecords: AttendanceData[] = [];
  private hasFlaggedRecordsChangedSubject = new BehaviorSubject<boolean>(false);
  hasFlaggedRecordsChanged$ =
    this.hasFlaggedRecordsChangedSubject.asObservable();

  private previousRecords: AttendanceData[] = []; // Store the previous value for comparison

  // Method to update the flagged attendance records
  updateFlaggedAttendanceRecords(records: AttendanceData[]): void {
    const storedRecords = localStorage.getItem('previousRecords');
    this.previousRecords = storedRecords ? JSON.parse(storedRecords) : [];
    // Compare the new records with the previous records
    const hasChanged = !this.areRecordsEqual(this.previousRecords, records);

    if (hasChanged) {
      this.flaggedAttendanceRecords = records;
      this.hasFlaggedRecordsChangedSubject.next(true);
      this.previousRecords = [...records];
      //store previous records to local storages to prevent effects of refreshing the page
      localStorage.setItem(
        'previousRecords',
        JSON.stringify(this.previousRecords)
      );
    }
  }

  // Method to get the flagged attendance records
  getFlaggedAttendanceRecords(): AttendanceData[] {
    return this.flaggedAttendanceRecords;
  }

  // Utility method to compare two arrays of AttendanceData
  private areRecordsEqual(
    records1: AttendanceData[],
    records2: AttendanceData[]
  ): boolean {
    if (records1.length !== records2.length) {
      return false;
    }

    // Compare each record in the arrays
    return records1.every((record, index) => {
      const otherRecord = records2[index];
      return (
        record.id === otherRecord.id &&
        record.studentId === otherRecord.studentId &&
        record.studentName === otherRecord.studentName &&
        record.FRIdentifiedId === otherRecord.FRIdentifiedId &&
        record.checkInTime === otherRecord.checkInTime &&
        record.status === otherRecord.status &&
        record.flagged === otherRecord.flagged
      );
    });
  }
}
