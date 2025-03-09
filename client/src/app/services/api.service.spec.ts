import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        ApiService,
      ],
    });

    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(apiService).toBeTruthy();
  });
});
