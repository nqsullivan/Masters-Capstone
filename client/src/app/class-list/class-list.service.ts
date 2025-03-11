import { Injectable } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Class } from '../models/models';
import { catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassListService {

  constructor(private apiService: ApiService) { }

  getList(): Observable<Class[]> {
    return this.apiService
      .get<{data: Class[]}>('classes')
      .pipe(
        map((response) => {
          if (response.data.length > 0) {
            return response.data;
          }
          return [];
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return of(false);
        })
      );
  }
}
