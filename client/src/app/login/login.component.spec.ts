import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, CommonModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        ApiService,
        AuthService,
      ],
    });

    component = TestBed.createComponent(LoginComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
