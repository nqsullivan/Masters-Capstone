import { Student } from './student.js';

export interface StudentPageResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Student[];
}
