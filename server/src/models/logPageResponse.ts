import { Log } from './log.js';

export interface LogPageResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Log[];
}
