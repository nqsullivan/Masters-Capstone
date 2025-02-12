import { DuckDBInstance } from '@duckdb/node-api';

async function init() {
  const instance = await DuckDBInstance.create('data/database.db');
  const db = await instance.connect();

  try {
    await db.run('CREATE TABLE IF NOT EXISTS class (id VARCHAR, name VARCHAR)');

    const classData = [
      ['1', 'Class 1'],
      ['2', 'Class 2'],
      ['3', 'Class 3'],
    ];
    for (const data of classData) {
      await db.run('INSERT INTO class (id, name) VALUES (?, ?)', data);
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS student (id VARCHAR, name VARCHAR, class_id VARCHAR, image VARCHAR)'
    );

    const studentData = [
      ['1', 'Student 1', '1', 'https://via.placeholder.com/150'],
      ['2', 'Student 2', '1', 'https://via.placeholder.com/150'],
      ['3', 'Student 3', '2', 'https://via.placeholder.com/150'],
      ['4', 'Student 4', '2', 'https://via.placeholder.com/150'],
      ['5', 'Student 5', '3', 'https://via.placeholder.com/150'],
      ['6', 'Student 6', '3', 'https://via.placeholder.com/150'],
    ];
    for (const data of studentData) {
      await db.run(
        'INSERT INTO student (id, name, class_id, image) VALUES (?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS student_class_lookup (student_id VARCHAR, class_id VARCHAR)'
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
        'INSERT INTO student_class_lookup (student_id, class_id) VALUES (?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS session (id VARCHAR, start_time DATETIME, end_time DATETIME, class_id VARCHAR)'
    );

    const sessionData = [
      ['1', '2021-01-01 08:00:00', '2021-01-01 10:00:00', '1'],
      ['2', '2021-01-01 08:00:00', '2021-01-01 10:00:00', '2'],
      ['3', '2021-01-01 08:00:00', '2021-01-01 10:00:00', '3'],
    ];
    for (const data of sessionData) {
      await db.run(
        'INSERT INTO session (id, start_time, end_time, class_id) VALUES (?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS attendance (id VARCHAR, student_id VARCHAR, session_id VARCHAR, check_in DATETIME, did_check_in BOOLEAN)'
    );

    const attendanceData = [
      ['1', '1', '1', '2021-01-01 08:00:00', true],
      ['2', '2', '1', '2021-01-01 08:00:00', true],
      ['3', '3', '2', '2021-01-01 08:00:00', true],
      ['4', '4', '2', '2021-01-01 08:00:00', true],
      ['5', '5', '3', '2021-01-01 08:00:00', true],
      ['6', '6', '3', '2021-01-01 08:00:00', true],
    ];
    for (const data of attendanceData) {
      await db.run(
        'INSERT INTO attendance (id, student_id, session_id, check_in, did_check_in) VALUES (?, ?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS user (id VARCHAR, type VARCHAR, username VARCHAR, password VARCHAR)'
    );

    const userData = [
      ['1', 'admin', 'admin', 'admin'],
      ['2', 'teacher', 'teacher', 'teacher'],
      ['3', 'student', 'student', 'student'],
    ];
    for (const data of userData) {
      await db.run(
        'INSERT INTO user (id, type, username, password) VALUES (?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS professor_class_lookup (username VARCHAR, class_id VARCHAR)'
    );

    const professorClassData = [
      ['2', '1'],
      ['2', '2'],
      ['2', '3'],
    ];
    for (const data of professorClassData) {
      await db.run(
        'INSERT INTO professor_class_lookup (username, class_id) VALUES (?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS log (id VARCHAR, timestamp DATETIME, user_id VARCHAR, action VARCHAR, entity_type VARCHAR, entity_id VARCHAR)'
    );

    const logData = [
      ['1', '2021-01-01 08:00:00', '1', 'login', 'user', '1'],
      ['2', '2021-01-01 08:00:00', '2', 'login', 'user', '2'],
      ['3', '2021-01-01 08:00:00', '3', 'login', 'user', '3'],
    ];
    for (const data of logData) {
      await db.run(
        'INSERT INTO log (id, timestamp, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
        data
      );
    }

    await db.run(
      'CREATE TABLE IF NOT EXISTS credential (user_id VARCHAR, hash VARCHAR)'
    );

    await db.close();

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

init();
