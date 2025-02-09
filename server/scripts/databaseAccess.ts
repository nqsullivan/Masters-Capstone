import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import fs from 'fs';

class DatabaseSAccess {
  private instance: DuckDBInstance;
  private connection: DuckDBConnection;

  constructor(private databasePath: string) {

  }

  async connect() {
    // Check if the database file exists
    if (!fs.existsSync(this.databasePath)) {
      throw new Error(`Database at ${this.databasePath} does not exist.`);
    }
    this.instance = await DuckDBInstance.create(this.databasePath);
    this.connection = await this.instance.connect();
  }

  async disconnect() {
    this.connection.close();
  }

  // run a query tht does not return any rows
  async runWithNoReturned(query: string, params: any[] = []) {
    return this.connection.run(query, params);
  }

  // run a query that returns rows
  async runAndReturnedRows(query: string, params: any[] = []) {
    const result = await this.connection.runAndReadAll(query, params);
    const rows = result.getRows();
    console.log(rows);
    return rows;
  }

}

export default DatabaseSAccess;