
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css'],
})
export class LoginModalComponent {
  username: string = '';
  password: string = '';

  constructor(private dialogRef: MatDialogRef<LoginModalComponent>) {}

  onSubmit() {
    console.log('Username:', this.username);
    console.log('Password:', this.password);
    this.dialogRef.close();
  }

  onCancel() {
    this.dialogRef.close();
  }
}
