import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../src/services/database.js';
import AuthService from '../src/services/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function randomDate(): string {
  const start = new Date();
  start.setDate(start.getDate() - Math.floor(Math.random() * 30));
  return start.toISOString();
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

async function generateTestData() {
  const db = await DatabaseAccess.getInstance();
  await AuthService.init();
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
    await db.runWithNoReturned(
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
    await db.runWithNoReturned(
      `INSERT INTO student (id, name, image) VALUES (?, ?, ?)`,
      [student.id, student.name, student.image]
    );
  }

  // Assign students to classes
  for (const student of students) {
    const assignedClass = classes[Math.floor(Math.random() * classes.length)];
    await db.runWithNoReturned(
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
      await db.runWithNoReturned(
        `INSERT INTO session (id, startTime, endTime, classId) VALUES (?, ?, ?, ?)`,
        [session.id, session.startTime, session.endTime, session.classId]
      );
    }
  }

  // Create attendance records
  for (const session of sessions) {
    for (const student of students) {
      if (randomBoolean()) {
        await db.runWithNoReturned(
          `INSERT INTO attendance (id, studentId, sessionId, checkIn, portraitUrl, portraitCaptured) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), student.id, session.id, randomDate(), student.image, true]
        );
      }
    }
  }

  // Create professor-class associations
  const professors = [{ username: 'prof1' }, { username: 'prof2' }];
  for (const prof of professors) {
    const assignedClass = classes[Math.floor(Math.random() * classes.length)];
    await db.runWithNoReturned(
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
      await AuthService.register(user.username, user.password);
      console.log(`Created user: ${user.username} (${user.type})`);
    } catch (error: any) {
      console.error(`Failed to create user ${user.username}:`, error.message);
    }
  }

  console.log('Test data successfully inserted.');
  await db.disconnect();
}

// Run the script
generateTestData()
  .then(() => console.log('Test data generation completed.'))
  .catch((error) => console.error('Error generating test data:', error));
