import { Log } from './log.js';

export interface LogPageResponse {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  data: Log[];
}
