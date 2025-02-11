import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';

class DatabaseSAccess {
  private instance!: DuckDBInstance;
  private connection!: DuckDBConnection;

  constructor(private databasePath: string) {}

  async connect() {
    try {
      this.instance = await DuckDBInstance.create(this.databasePath);
      this.connection = await this.instance.connect();

      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS class (id VARCHAR, name VARCHAR)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS student (id VARCHAR, name VARCHAR, class_id VARCHAR, image VARCHAR)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS student_class_lookup (student_id VARCHAR, class_id VARCHAR)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS session (id VARCHAR, start_time DATETIME, end_time DATETIME, class_id VARCHAR)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS attendance (id VARCHAR, student_id VARCHAR, session_id VARCHAR, check_in DATETIME, did_check_in BOOLEAN)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS user (id VARCHAR, type VARCHAR, username VARCHAR, password VARCHAR)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS professor_class_lookup (professor_id VARCHAR, class_id VARCHAR)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS log (id VARCHAR, timestamp DATETIME, user_id VARCHAR, action VARCHAR, entity_type VARCHAR, entity_id VARCHAR)'
      );
      await this.connection.run(
        'CREATE TABLE IF NOT EXISTS credentials (user_id VARCHAR, hash VARCHAR, salt VARCHAR)'
      );

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
