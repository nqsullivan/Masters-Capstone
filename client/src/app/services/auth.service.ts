import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = '';

  constructor(private apiService: ApiService) {}

  login(username: string, password: string): Observable<boolean> {
    return this.apiService
      .post<{ token: string }>('login', { username, password })
      .pipe(
        map((data) => {
          if (data.token) {
            localStorage.setItem(this.tokenKey, data.token);
            localStorage.setItem('username', username);
            return true;
          }
          return false;
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return of(false);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }
}
