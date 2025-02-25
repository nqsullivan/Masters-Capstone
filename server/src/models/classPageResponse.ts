import { Class } from './class.js';

export interface ClassPageResponse {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  data: Class[];
}
