import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';

class DatabaseAccess {
  private static instance: DatabaseAccess;
  private duckDB!: DuckDBInstance;
  private connection!: DuckDBConnection;

  private constructor(private databasePath: string) {}

  static async getInstance(): Promise<DatabaseAccess> {
    const databasePath = process.env.DATABASE_PATH || 'data/database.db';
    if (!DatabaseAccess.instance) {
      DatabaseAccess.instance = new DatabaseAccess(databasePath);
      await DatabaseAccess.instance.connect();
    }
    return DatabaseAccess.instance;
  }

  private async connect() {
    try {
      this.duckDB = await DuckDBInstance.create(this.databasePath);
      this.connection = await this.duckDB.connect();

      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS class (id VARCHAR, name VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS student (id VARCHAR, name VARCHAR, class_id VARCHAR, image VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS student_class_lookup (student_id VARCHAR, class_id VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS session (id VARCHAR, start_time DATETIME, end_time DATETIME, class_id VARCHAR, professor_id VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS attendance (id VARCHAR, student_id VARCHAR, session_id VARCHAR, check_in DATETIME, did_check_in BOOLEAN)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS user (id VARCHAR, type VARCHAR, username VARCHAR, password VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS professor_class_lookup (username VARCHAR, class_id VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS log (id VARCHAR, timestamp DATETIME, user_id VARCHAR, action VARCHAR, entity_type VARCHAR, entity_id VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS credential (username VARCHAR, hash VARCHAR)`
      );
      await this.connection.run(
        `CREATE TABLE IF NOT EXISTS student_session_lookup (student_id VARCHAR, session_id VARCHAR)`
      );

      console.log('Database connected');
    } catch (error) {
      console.error('Database connection error:', error);
      throw new Error('Database file not found');
    }
  }

  async disconnect() {
    if (this.connection) {
      this.connection.close();
    }
  }

  async runWithNoReturned(query: string, params: any[] = []) {
    if (!this.connection) {
      await this.connect();
    }

    return this.connection.run(query, params);
  }

  async runAndReadAll<T>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.connection) {
      await this.connect();
    }

    const result = await this.connection.runAndReadAll(query, params);
    return result.getRowObjects() as T[];
  }
}

export default DatabaseAccess;
