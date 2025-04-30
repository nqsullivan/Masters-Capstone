import { DuckDBInstance } from '@duckdb/node-api';
import * as fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

async function archiveDatabase(dbPath) {
  try {
    await fs.mkdir('data/archive');
  } catch (error) {}
  try {
    await fs.access(dbPath); // Check if the database file exists
    await fs.rename(dbPath, 'data/archive/database-' + Date.now() + '.db'); // Rename the file to archive it
    console.log(`Database '${dbPath}' archived successfully.`);
  } catch (error) {
    console.error(`Error archiving database '${dbPath}':`, error);
  }

  // Hold at most 5 archives
  try {
    const files = await fs.readdir('data/archive');
    if (files.length > 5) {
      for (let i = 0; i < files.length - 5; i++) {
        await fs.unlink(`data/archive/${files[i]}`);
      }
      console.log('Old archives deleted successfully.');
    }
  } catch (error) {
    console.error('Error deleting old archives:', error);
  }
}

const randomDate = () => {
  const start = new Date();
  start.setDate(start.getDate() - Math.floor(Math.random() * 30));
  return start.toISOString();
};

const randomBoolean = () => {
  return Math.random() > 0.5;
};

const initializeDatabase = async (db) => {
  await db.run(`CREATE TABLE IF NOT EXISTS class (
    id VARCHAR,
    name VARCHAR,
    roomNumber VARCHAR,
    startTime TIME,
    endTime TIME
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS student (
    id VARCHAR,
    name VARCHAR,
    image VARCHAR
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS student_class_lookup (
    studentId VARCHAR,
    classId VARCHAR
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS session (
    id VARCHAR,
    startTime DATETIME,
    endTime DATETIME,
    classId VARCHAR
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR,
    studentId VARCHAR,
    sessionId VARCHAR,
    checkIn DATETIME DEFAULT NULL,
    portraitUrl VARCHAR,
    portraitCaptured BOOLEAN,
    FRIdentifiedId VARCHAR,
    status VARCHAR,
    flagged BOOLEAN DEFAULT FALSE,
    videoKey VARCHAR(2083)
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS user (
    id VARCHAR,
    type VARCHAR,
    username VARCHAR,
    password VARCHAR
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS professor_class_lookup (
    username VARCHAR,
    classId VARCHAR
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS log (
    id VARCHAR,
    timestamp DATETIME,
    userId VARCHAR,
    action VARCHAR,
    entityType VARCHAR,
    entityId VARCHAR
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS credential (
    username VARCHAR,
    hash VARCHAR
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS student_session_lookup (
    studentId VARCHAR,
    sessionId VARCHAR
  )`);

  await db.run(`CREATE SEQUENCE IF NOT EXISTS api_keys_id_seq START 1`);

  await db.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT DEFAULT NEXTVAL('api_keys_id_seq') PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days'),
    is_revoked BOOLEAN DEFAULT FALSE
  )`);
};

const generateTestData = async (db) => {
  console.log('Generating test data...');

  // Create sample classes
  const classes = [
    {
      id: uuidv4(),
      name: 'Math 101',
      roomNumber: 'PRLTA202',
      startTime: '10:00:00',
      endTime: '11:15:00',
    },
    {
      id: uuidv4(),
      name: 'History 201',
      roomNumber: 'SAN101',
      startTime: '10:00:00',
      endTime: '11:15:00',
    },
    {
      id: uuidv4(),
      name: 'Computer Science 301',
      roomNumber: 'PRLTA202',
      startTime: '11:30:00',
      endTime: '12:45:00',
    },
  ];

  for (const cls of classes) {
    await db.run(
      'INSERT INTO class (id, name, roomNumber, startTime, endTime) VALUES (?, ?, ?, ?, ?)',
      [cls.id, cls.name, cls.roomNumber, cls.startTime, cls.endTime]
    );
  }

  // Create sample students
  const students = Array.from({ length: 10 }, () => ({
    id: uuidv4(),
    name: `Student ${Math.floor(Math.random() * 1000)}`,
    image: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg`,
  }));

  for (const student of students) {
    await db.run(`INSERT INTO student (id, name, image) VALUES (?, ?, ?)`, [
      student.id,
      student.name,
      student.image,
    ]);
  }

  // Assign students to classes
  for (const student of students) {
    const assignedClass = classes[Math.floor(Math.random() * classes.length)];
    await db.run(
      `INSERT INTO student_class_lookup (studentId, classId) VALUES (?, ?)`,
      [student.id, assignedClass.id]
    );
  }

  // Create sessions for each class
  const sessions = [];
  for (const cls of classes) {
    for (let i = 0; i < 5; i++) {
      const session = {
        id: uuidv4(),
        startTime: randomDate(),
        endTime: randomDate(),
        classId: cls.id,
        professorId: uuidv4(),
      };
      sessions.push(session);
      await db.run(
        `INSERT INTO session (id, startTime, endTime, classId) VALUES (?, ?, ?, ?)`,
        [session.id, session.startTime, session.endTime, session.classId]
      );
    }
  }

  // Create attendance records
  for (const session of sessions) {
    for (const student of students) {
      if (randomBoolean()) {
        await db.run(
          `INSERT INTO attendance (id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured, FRIdentifiedId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            student.id,
            session.id,
            randomDate(),
            student.image,
            true,
            student.id,
          ]
        );
      }
    }
  }

  // Create professor-class associations
  const professors = [{ username: 'prof1' }, { username: 'prof2' }];
  for (const prof of professors) {
    const assignedClass = classes[Math.floor(Math.random() * classes.length)];
    await db.run(
      `INSERT INTO professor_class_lookup (username, classId) VALUES (?, ?)`,
      [prof.username, assignedClass.id]
    );
  }

  // Create actual users for login
  const users = [
    { username: 'prof1', password: 'password123', type: 'professor' },
    { username: 'prof2', password: 'password123', type: 'professor' },
    { username: 'admin', password: 'adminpass', type: 'admin' },
  ];

  for (const user of users) {
    try {
      await db.run(
        `INSERT INTO user (id, type, username, password) VALUES (?, ?, ?, ?)`,
        [uuidv4(), user.type, user.username, user.password]
      );

      const hashedPassword = await bcrypt.hash(user.password, 10);

      await db.run(`INSERT INTO credential (username, hash) VALUES (?, ?)`, [
        user.username,
        hashedPassword,
      ]);

      console.log(`Created user: ${user.username} (${user.type})`);
    } catch (error) {
      console.error(`Failed to create user ${user.username}:`, error.message);
    }
  }

  console.log('Test data successfully inserted.');
};

async function init() {
  const dbPath = 'data/database.db';

  console.log('Current directory:', process.cwd());
  console.log('Database path:', process.cwd() + '/' + dbPath);

  await archiveDatabase(dbPath);

  const instance = await DuckDBInstance.create(dbPath);
  const db = await instance.connect();

  try {
    await initializeDatabase(db);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    return;
  }

  try {
    await generateTestData(db);
    console.log('Test data generation completed.');
  } catch (error) {
    console.error('Error generating test data:', error);
  }
}

init();
