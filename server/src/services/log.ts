import { v4 as uuidv4 } from 'uuid';
import { CreateLogRequest }  from '../models/logRequest';
import { Log } from '../models/log.ts';

class LogService {
  private logs: Log[] = [];

  async getLog(id: string): Promise<Log> {
    const existingLog = this.logs.find((log) => log.id === id);
    if (existingLog) {
      return existingLog;
    }
    throw new Error(`Log with id '${id}' not found`);
  }

  async createLog(logDetails: CreateLogRequest): Promise<Log> {
    const newLog: Log = {
      id: uuidv4(),
      timestamp: new Date(),
      user_id: logDetails.user_id,
      action: logDetails.action,
      entity_type: logDetails.entity_type,
      entity_id: logDetails.entity_id,
    };
    this.logs.push(newLog);
    return newLog;
  }

  async deleteLog(id: string) {
    const existingLog = this.logs.find((log) => log.id === id);
    if (!existingLog) {
      throw new Error(`Log with id '${id}' not found`);
    }
    const index = this.logs.indexOf(existingLog);
    this.logs.splice(index, 1);
  }
}

export default new LogService();
