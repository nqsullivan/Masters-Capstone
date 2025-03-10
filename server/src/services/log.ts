import { v4 as uuidv4 } from 'uuid';
import { CreateLogRequest } from '../models/logRequest.js';
import { Log } from '../models/log.js';
import { LogPageResponse } from '../models/logPageResponse.js';
import DatabaseAccess from '../services/database.js';
import UtilService from '../services/util.js';

class LogService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async getLog(id: string): Promise<Log> {
    const result = await this.db.runAndReadAll<Log>(
      `SELECT id, timestamp, user_id, action, entity_type, entity_id FROM log WHERE id = ?`,
      [id]
    );

    if (result.length > 0) {
      const log = result[0];

      // Work around since DuckDB stores timestamps as BIGINT which doesn't automatically serialize in Node
      return {
        ...log,
        timestamp: UtilService.formatDate(log.timestamp)
      };
    }
    throw new Error(`Log with id '${id}' not found`);
  }

  async createLog(logDetails: CreateLogRequest): Promise<Log> {
    const id = uuidv4();
    const currentDate = this.db.getCurrentDate();

    const preparedStmt = await this.db.getPreparedStatementObject(
      'INSERT INTO log (id, timestamp, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5, $6)'
    );

    preparedStmt.bindVarchar(1, id);
    preparedStmt.bindTimestamp(2, currentDate);
    preparedStmt.bindVarchar(3, logDetails.user_id);
    preparedStmt.bindVarchar(4, logDetails.action);
    preparedStmt.bindVarchar(5, logDetails.entity_type);
    preparedStmt.bindVarchar(6, logDetails.entity_id);

    await this.db.runPreparedStatement(preparedStmt);

    return {
      id: id,
      timestamp: currentDate.toString(),
      user_id: logDetails.user_id,
      action: logDetails.action,
      entity_type: logDetails.entity_type,
      entity_id: logDetails.entity_id,
    };
  }

  async deleteLog(id: string) {
    const existingLog = await this.getLog(id);
    await this.db.runWithNoReturned(`DELETE FROM log WHERE id = ?`, [id]);
  }

  async getLogPage(page: number, size: number): Promise<LogPageResponse> {
    const pageResponse = await UtilService.buildPageResponse<Log>(
      page,
      size,
      'Log'
    );
    pageResponse.data.forEach((log) => {
      log.timestamp = UtilService.formatDate(log.timestamp);
    });
    return pageResponse;
  }
}

export default new LogService();
