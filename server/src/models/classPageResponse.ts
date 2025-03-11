import { Class } from './class.js';

export interface ClassPageResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Class[];
}
