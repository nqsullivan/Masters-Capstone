
import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router'; // 导入 RouterModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatLabel } from '@angular/material/form-field';
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
