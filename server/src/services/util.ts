import DatabaseAccess from '../services/database.js';

class UtilService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async buildPageResponse<T>(
    page: number,
    size: number,
    tableName: string,
    optWhereClause: string = ''
  ) {
    if (size > 100) {
      size = 100;
    }

    const offset = (page - 1) * size;

    const pageData = await this.db.runAndReadAll<T>(
      `SELECT * from ${tableName} ${optWhereClause} LIMIT ? OFFSET ?`,
      [size, offset]
    );

    const countResponse = await this.db.runAndReadAll(
      `SELECT count(id) from ${tableName} ${optWhereClause}`
    );

    const totalCountObj = countResponse[0] as any;
    const totalCountLogs = Number(totalCountObj['count(id)']);
    const totalPages = Math.ceil(totalCountLogs / size);

    return {
      page: page,
      pageSize: size,
      totalItems: totalCountLogs,
      totalPages: totalPages,
      data: pageData,
    };
  }

  formatDate(date: string | null | undefined): string {
    return date ? date.toString() : '';
  }

  formatNumber(value: number | bigint): number {
    return typeof value === 'bigint' ? Number(value) : value;
  }
}

export default new UtilService();
