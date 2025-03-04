
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LoginModalComponent } from '../login-modal/login-modal.component';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  constructor(private dialog: MatDialog) {}

  openLoginModal() {
    this.dialog.open(LoginModalComponent, {
      width: '300px',
    });
  }
}
