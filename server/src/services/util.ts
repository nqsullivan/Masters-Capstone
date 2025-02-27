import DatabaseAccess from '../services/database.js';

class UtilService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async buildPageResponse<T>(page: number, size: number, tableName: string) {
    if (size > 100) {
      size = 100;
    }

    const offset = (page - 1) * size;

    const pageData = await this.db.runAndReadAll<T>(
      `SELECT * from ${tableName} LIMIT ? OFFSET ?`,
      [size, offset]
    );

    const countResponse = await this.db.runAndReadAll(
      `SELECT count(id) from ${tableName}`
    );

    const totalCountObj = countResponse[0] as any;
    const totalCountLogs = Number(totalCountObj['count(id)']);
    const totalPages = Math.ceil(totalCountLogs / size);

    return {
      page: page,
      page_size: size,
      total_items: totalCountLogs,
      total_pages: totalPages,
      data: pageData,
    };
  }
}

export default new UtilService();
