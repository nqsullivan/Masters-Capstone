import { DuckDBInstance } from '@duckdb/node-api';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('../../data/database.db');
const instance = await DuckDBInstance.create(DB_PATH);

const SCHEMA_PATH = path.resolve('./database/schema.sql');
const schemaSQL = fs.readFileSync(SCHEMA_PATH, 'utf-8');

const executeSchema = async () => {
  try {
    const connection = await instance.connect();
    await connection.run(schemaSQL);
    connection.close();
  } catch (error) {
    console.error('Error initializing database schema:', error);
  }
};

await executeSchema();

export const runQuery = async (query, params = []) => {
  const connection = await instance.connect();
  const result = await (
    await connection.runAndReadAll(query, params)
  ).getRowObjects();
  connection.close();
  return result;
};
