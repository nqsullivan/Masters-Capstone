import express, { Request, Response } from 'express';
import { DuckDBInstance } from '@duckdb/node-api';
import init from './initializeData.js';
import DatabaseSAccess from './databaseAccess.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the Node.js + TypeScript API!');
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  //create and initialize the database
  await init();
  //connect to the database
  const dbAccess = new DatabaseSAccess('data/database.db');
  await dbAccess.connect();
  //run a query that returns rows
  const rows = await dbAccess.runAndReturnedRows('SELECT * FROM class');
  console.log(rows);

  /**
      // https://duckdb.org/docs/api/node_neo/overview
      // Connect to DB store
      const instance = await DuckDBInstance.create('src/db/testdb.db');
      const connection = await instance.connect();

      // Execute SQL and retrieve results
      await connection.run('create table if not exists test_table(x INTEGER, y INTEGER)');
      await connection.run('insert into test_table values (1,1)');
      const result = await connection.runAndReadAll('select * from test_table');
      const rows = result.getRows();
      console.log(rows);
      connection.close();
     */

  /**
        // https://github.com/auth0/node-jsonwebtoken
        const token = jwt.sign({
                    role: user.role,
                }, tokenSecret, {
                    algorithm: 'HS256',
                    expiresIn: '5m',
                    issuer: 'my-api',
                    subject: user.id
                })
      */
});
