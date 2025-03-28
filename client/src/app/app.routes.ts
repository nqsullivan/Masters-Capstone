import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
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
  },
  { path: 'classes', component: ClassListComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'class/:id', component: IndividualClassComponent },
  { path: 'session/:id', component: IndividualSessionComponent },
  { path: 'student/:id', component: IndividualStudentComponent },
  { path: '**', redirectTo: 'dashboard' },
];
