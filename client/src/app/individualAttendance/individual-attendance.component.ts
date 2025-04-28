import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AttendanceRecord } from '../models/models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-individual-attendance',
  imports: [RouterModule],
  templateUrl: './individual-attendance.component.html',
  styleUrl: './individual-attendance.component.css',
})
export class IndividualAttendanceComponent {
  attendanceId: string | null = null;

  attendanceInfo: AttendanceRecord;
  videoUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.attendanceId = params.get('id');
      if (this.attendanceId) {
        this.getAttendanceInfo(this.attendanceId);
      }
    });
  }

  getAttendanceInfo(attendanceId: string): void {
    this.apiService
      .get<AttendanceRecord>(`attendance/${attendanceId}`)
      .subscribe((response) => {
        this.attendanceInfo = response;
        console.log(this.attendanceInfo);

        if (this.attendanceInfo.studentImage.includes('amazonaws.com')) {
          const index =
            this.attendanceInfo.studentImage.indexOf('amazonaws.com');
          const key = this.attendanceInfo.studentImage.slice(
            index + 'amazonaws.com/'.length
          );
          this.apiService
            .get<{ imageUrl: string }>(`image/${key}`)
            .subscribe(
              (res) => (this.attendanceInfo.studentImage = res.imageUrl)
            );
        }

        if (this.attendanceInfo.portraitUrl.includes('amazonaws.com')) {
          const index =
            this.attendanceInfo.portraitUrl.indexOf('amazonaws.com');
          const key = this.attendanceInfo.portraitUrl.slice(
            index + 'amazonaws.com/'.length
          );
          this.apiService
            .get<{ imageUrl: string }>(`image/${key}`)
            .subscribe(
              (res) => (this.attendanceInfo.portraitUrl = res.imageUrl)
            );
        }

        if (this.attendanceInfo.videoKey) {
          this.getVideoPresignedUrl(this.attendanceInfo.videoKey);
        }
      });
  }

  getVideoPresignedUrl(videoKey: string): void {
    this.apiService
      .get<{ videoUrl: string }>(`video/presigned-url/${videoKey}`)
      .subscribe(
        (response) => {
          this.videoUrl = response.videoUrl; // Set the pre-signed URL
          console.log('Pre-signed video URL:', this.videoUrl);
        },
        (error) => {
          console.error('Error fetching pre-signed video URL:', error);
        }
      );
  }
}
