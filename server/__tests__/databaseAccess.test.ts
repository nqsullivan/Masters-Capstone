import DatabaseSAccess from '../src/services/database';
import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import {
  expect,
  test,
  describe,
  afterEach,
  beforeEach,
  jest,
} from '@jest/globals';

jest.mock('@duckdb/node-api');

//mock duckdb functions
jest.mock('@duckdb/node-api', () => {
  // Create a mock database connection object
  const mockConnection = {
    run: jest.fn(),
    runAndReadAll: jest.fn(() => ({
      getRows: jest.fn().mockReturnValue([{ id: 1, name: 'Test' }]),
    })),
    close: jest.fn(),
  };

  return {
    DuckDBInstance: {
      create: jest.fn(async () => ({
        connect: jest.fn(async () => mockConnection),
      })),
    },
  };
});

describe('DatabaseSAccess', () => {
  let db: DatabaseSAccess;
  // Every test will have a new instance of the DatabaseSAccess class
  beforeEach(async () => {
    db = new DatabaseSAccess('test.db'); // Create an instance with a mock database path
    await db.connect(); // Establish a connection
  });

  //Every test will disconnect from the database
  afterEach(async () => {
    await db.disconnect();
  });

  // Test executing a query that does not return any rows
  test('runs a query with no returned rows', async () => {
    const query = 'INSERT INTO users (name) VALUES (?)';
    await db.runWithNoReturned(query, ['Alice']);
    expect(db['connection'].run).toHaveBeenCalledWith(query, ['Alice']);
  });

  // Test executing a query that returns rows
  test('runs a query and returns rows', async () => {
    const query = 'SELECT * FROM users'; // Example query
    const rows = await db.runAndReturnedRows(query); // Execute the query
    expect(db['connection'].runAndReadAll).toHaveBeenCalledWith(query, []);
    expect(rows).toEqual([{ id: 1, name: 'Test' }]);
  });
});
