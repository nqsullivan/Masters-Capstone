import {
  DuckDBInstance,
  DuckDBConnection,
  DuckDBPreparedStatement,
  DuckDBTimestampValue,
} from '@duckdb/node-api';

class DatabaseAccess {
  private static instance: DatabaseAccess;
  private duckDB!: DuckDBInstance;
  private connection!: DuckDBConnection;

  private constructor(private databasePath: string) {}

  static async getInstance(): Promise<DatabaseAccess> {
    const databasePath = process.env.DATABASE_PATH || 'data/database.db';
    if (!DatabaseAccess.instance) {
      DatabaseAccess.instance = new DatabaseAccess(databasePath);
    }
    return DatabaseAccess.instance;
  }

  private async connect() {
    this.duckDB = await DuckDBInstance.create(this.databasePath);
    this.connection = await this.duckDB.connect();

    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS class (id VARCHAR, name VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS student (id VARCHAR, name VARCHAR, image VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS student_class_lookup (studentId VARCHAR, classId VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS session (id VARCHAR, startTime DATETIME, endTime DATETIME, classId VARCHAR, professorId VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS attendance (id VARCHAR, studentId VARCHAR, sessionId VARCHAR, checkIn DATETIME, portraitUrl VARCHAR, portraitCaptured BOOLEAN)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS user (id VARCHAR, type VARCHAR, username VARCHAR, password VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS professor_class_lookup (username VARCHAR, classId VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS log (id VARCHAR, timestamp DATETIME, userId VARCHAR, action VARCHAR, entityType VARCHAR, entityId VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS credential (username VARCHAR, hash VARCHAR)`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS student_session_lookup (studentId VARCHAR, sessionId VARCHAR)`
    );
    await this.connection.run(
      `CREATE SEQUENCE IF NOT EXISTS api_keys_id_seq START 1`
    );
    await this.connection.run(
      `CREATE TABLE IF NOT EXISTS api_keys (
        id BIGINT DEFAULT NEXTVAL('api_keys_id_seq') PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        key TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days'),
        is_revoked BOOLEAN DEFAULT FALSE
      )`
    );

    console.log('Database connected');
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

  /**
    To be used to retrieve a prepared statement which are formatted like 'SELECT $1, $2'.
    From the calling service class, bind the statement like below:
    prepared.bindTimestamp(1, new DuckDBTimestampValue(time));
    prepared.bindDecimal(2, new DuckDBDecimalValue(value, width, scale));
 */
  async getPreparedStatementObject(query: string) {
    if (!this.connection) {
      await this.connect();
    }
    return await this.connection.prepare(query);
  }

  async runPreparedStatement(preparedQuery: DuckDBPreparedStatement) {
    return await preparedQuery.run();
  }

  async runAndReadAll<T>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.connection) {
      await this.connect();
    }
    const result = await this.connection.runAndReadAll(query, params);
    return result.getRowObjects() as T[];
  }

  getCurrentDate(): DuckDBTimestampValue {
    return new DuckDBTimestampValue(BigInt(Date.now() * 1000));
  }
}

export default DatabaseAccess;
