import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { FlagsComponent } from './flags/flags.component';
import { AuthGuard } from './guards/auth.guard';
import { ClassListComponent } from './class-list/class-list.component';
import { IndividualClassComponent } from './individualClass/individualClass.component';
import { IndividualSessionComponent } from './individualSession/individualSession.component';
import { IndividualStudentComponent } from './individualStudent/individualStudent.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { title: 'Dashboard' },
  },
  {
    path: 'classes',
    component: ClassListComponent,
    canActivate: [AuthGuard],
    data: { title: 'Classes' },
  },
  {
    path: 'attendance-flags',
    component: FlagsComponent,
    data: { title: 'Attendance Flags' },
  },
  { path: 'login', component: LoginComponent, data: { title: 'Login' } },
  {
    path: 'class/:id',
    component: IndividualClassComponent,
    data: { title: 'Class Details' },
  },
  {
    path: 'session/:id',
    component: IndividualSessionComponent,
    data: { title: 'Session Details' },
  },
  {
    path: 'student/:id',
    component: IndividualStudentComponent,
    data: { title: 'Student Details' },
  },
  { path: '**', redirectTo: 'dashboard' },
];
