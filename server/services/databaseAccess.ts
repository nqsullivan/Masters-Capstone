import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';

class DatabaseSAccess {
  private instance!: DuckDBInstance;
  private connection!: DuckDBConnection;

  constructor(private databasePath: string) {}

  async connect() {
    // Check if the database file exists
    try {
      this.instance = await DuckDBInstance.create(this.databasePath);
      this.connection = await this.instance.connect();
      console.log('Connected to database');
    } catch (error) {
      throw new Error('Database file not found');
    }
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
