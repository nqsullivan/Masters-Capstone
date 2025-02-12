import DatabaseAccess from '../src/services/database';
import {
  expect,
  test,
  describe,
  afterEach,
  beforeEach,
  jest,
} from '@jest/globals';

jest.mock('@duckdb/node-api', () => {
  const mockConnection = {
    run: jest.fn(),
    runAndReadAll: jest.fn(async () => ({
      getRowObjects: jest.fn().mockReturnValue([{ id: '1', name: 'Test' }]),
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

describe('DatabaseAccess', () => {
  let db: DatabaseAccess;

  beforeEach(async () => {
    db = await DatabaseAccess.getInstance();
  });

  afterEach(async () => {
    await db.disconnect();
  });

  test('runWithNoReturned executes a query without returning rows', async () => {
    const query = 'INSERT INTO user (id, username) VALUES (?, ?)';
    await db.runWithNoReturned(query, ['1', 'Alice']);
    expect(db['connection'].run).toHaveBeenCalledWith(query, ['1', 'Alice']);
  });

  test('runAndReadAll executes a query and returns rows', async () => {
    const query = 'SELECT * FROM user';
    const rows = await db.runAndReadAll(query);
    expect(db['connection'].runAndReadAll).toHaveBeenCalledWith(query, []);
    expect(rows).toEqual([{ id: '1', name: 'Test' }]);
  });

  test('getInstance returns the same instance', async () => {
    const instance1 = await DatabaseAccess.getInstance();
    const instance2 = await DatabaseAccess.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('disconnect closes the database connection', async () => {
    await db.disconnect();
    expect(db['connection'].close).toHaveBeenCalled();
  });
});
