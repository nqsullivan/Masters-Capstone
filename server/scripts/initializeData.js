import { DuckDBInstance } from '@duckdb/node-api';
import * as fs from 'node:fs/promises';

async function archiveDatabase(dbPath) {
  try {
    await fs.mkdir('data/archive');
  } catch (error) {}
  try {
    await fs.access(dbPath); // Check if the database file exists
    await fs.rename(dbPath, 'data/archive/database.db'); // Delete the database file
    console.log(`Database '${dbPath}' archived successfully.`);
  } catch (error) {
    console.error(`Error archiving database '${dbPath}':`, error);
  }
}

async function init() {
  const dbPath = 'data/database.db';
  archiveDatabase(dbPath);

  const instance = await DuckDBInstance.create(dbPath);
  const db = await instance.connect();

  try {
    await db.run(
      'CREATE TABLE IF NOT EXISTS class (id VARCHAR, name VARCHAR, roomNumber VARCHAR, startTime TIME, endTime TIME)'
    );

    const classData = [
      ['1', 'Class 1', 'SAN101', '10:00:00', '11:15:00'],
      ['2', 'Class 2', 'PRLTA103', '10:00:00', '11:15:00'],
      ['3', 'Class 3', 'PICHO105', '10:00:00', '11:15:00'],
    ];
    for (const data of classData) {
      await db.run(
        'INSERT INTO class (id, name, roomNumber, startTime, endTime) VALUES (?, ?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS student (id VARCHAR, name VARCHAR, image VARCHAR)'
    );

    const studentData = [
      ['1', 'Student 1', 'https://via.placeholder.com/150'],
      ['2', 'Student 2', 'https://via.placeholder.com/150'],
      ['3', 'Student 3', 'https://via.placeholder.com/150'],
      ['4', 'Student 4', 'https://via.placeholder.com/150'],
      ['5', 'Student 5', 'https://via.placeholder.com/150'],
      ['6', 'Student 6', 'https://via.placeholder.com/150'],
    ];
    for (const data of studentData) {
      await db.run(
        'INSERT INTO student (id, name, image) VALUES (?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS student_class_lookup (studentId VARCHAR, classId VARCHAR)'
    );

    const studentClassData = [
      ['1', '1'],
      ['2', '1'],
      ['3', '2'],
      ['4', '2'],
      ['5', '3'],
      ['6', '3'],
    ];
    for (const data of studentClassData) {
      await db.run(
        'INSERT INTO student_class_lookup (studentId, classId) VALUES (?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS session (id VARCHAR, startTime DATETIME, endTime DATETIME, classId VARCHAR, professorId VARCHAR)'
    );

    const sessionData = [
      ['1', '2021-01-01 08:00:00', '2021-01-01 10:00:00', '1', '1'],
      ['2', '2021-01-01 08:00:00', '2021-01-01 10:00:00', '2', '2'],
      ['3', '2021-01-01 08:00:00', '2021-01-01 10:00:00', '3', '3'],
    ];
    for (const data of sessionData) {
      await db.run(
        'INSERT INTO session (id, startTime, endTime, classId, professorId) VALUES (?, ?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS attendance (id VARCHAR, studentId VARCHAR, sessionId VARCHAR, checkIn DATETIME, portraitUrl VARCHAR, portraitCaptured BOOLEAN)'
    );

    const attendanceData = [
      [
        '1',
        '1',
        '1',
        '2021-01-01 08:00:00',
        'https://via.placeholder.com/150',
        true,
      ],
      [
        '2',
        '2',
        '1',
        '2021-01-01 08:00:00',
        'https://via.placeholder.com/150',
        true,
      ],
      [
        '3',
        '3',
        '2',
        '2021-01-01 08:00:00',
        'https://via.placeholder.com/150',
        true,
      ],
      [
        '4',
        '4',
        '2',
        '2021-01-01 08:00:00',
        'https://via.placeholder.com/150',
        true,
      ],
      [
        '5',
        '5',
        '3',
        '2021-01-01 08:00:00',
        'https://via.placeholder.com/150',
        true,
      ],
      [
        '6',
        '6',
        '3',
        '2021-01-01 08:00:00',
        'https://via.placeholder.com/150',
        true,
      ],
    ];
    for (const data of attendanceData) {
      await db.run(
        'INSERT INTO attendance (id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured) VALUES (?, ?, ?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS user (id VARCHAR, type VARCHAR, username VARCHAR, password VARCHAR)'
    );

    const userData = [
      ['admin', 'admin', 'admin'],
      ['teacher', 'teacher', 'teacher'],
      ['student', 'student', 'student'],
    ];
    for (const data of userData) {
      await db.run(
        'INSERT INTO user (type, username, password) VALUES (?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS professor_class_lookup (username VARCHAR, classId VARCHAR)'
    );

    const professorClassData = [
      ['2', '1'],
      ['2', '2'],
      ['2', '3'],
    ];
    for (const data of professorClassData) {
      await db.run(
        'INSERT INTO professor_class_lookup (username, classId) VALUES (?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS log (id VARCHAR, timestamp DATETIME, userId VARCHAR, action VARCHAR, entity_type VARCHAR, entityId VARCHAR)'
    );

    const logData = [
      ['1', '2021-01-01 08:00:00', '1', 'login', 'user', '1'],
      ['2', '2021-01-01 08:00:00', '2', 'login', 'user', '2'],
      ['3', '2021-01-01 08:00:00', '3', 'login', 'user', '3'],
    ];
    for (const data of logData) {
      await db.run(
        'INSERT INTO log (id, timestamp, userId, action, entity_type, entityId) VALUES (?, ?, ?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS credential (username VARCHAR, hash VARCHAR)'
    );

    await db.close();

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

init();
