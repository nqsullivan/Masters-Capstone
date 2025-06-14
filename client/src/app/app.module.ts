import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContactComponent } from './contact/contact.component';
import { FlagsComponent } from './flags/flags.component';
import { LoginComponent } from './login/login.component';
import { ClassListComponent } from './class-list/class-list.component';

import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';
import { routes } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ContactComponent,
    FlagsComponent,
    LoginComponent,
    ClassListComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    FormsModule,
  ],
  providers: [ApiService, AuthService, AuthGuard],
  bootstrap: [AppComponent],
})
export class AppModule {}
