import { Student } from './student.js';

export interface StudentPageResponse {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  data: Student[];
}
