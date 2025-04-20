import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { IndividualAttendanceComponent } from './individual-attendance.component';

describe('IndividualAttendanceComponent', () => {
  let component: IndividualAttendanceComponent;
  let fixture: ComponentFixture<IndividualAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualAttendanceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IndividualAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
