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
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';

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
  hasNewInfo: boolean = true; //indicate there are new unread flagged events
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
      });
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
}
