import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import DatabaseSAccess from './database.ts';
import { User } from '../models/user.ts';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

class AuthService {
  private static db: DatabaseSAccess;

  private constructor() {}

  static async init() {
    if (!AuthService.db) {
      AuthService.db = await DatabaseSAccess.getInstance();
    }
  }

  static async register(username: string, password: string): Promise<User> {
    if (!AuthService.db) throw new Error('AuthService not initialized');

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const existingUsers = await AuthService.db.runAndReadAll<{ id: string }>(
      'SELECT id FROM user WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      throw new Error('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await AuthService.db.runWithNoReturned(
      'INSERT INTO user (id, username, type) VALUES (?, ?, ?)',
      [userId, username, 'USER']
    );

    await AuthService.db.runWithNoReturned(
      'INSERT INTO credentials (user_id, hash) VALUES (?, ?)',
      [userId, hashedPassword]
    );

    return { id: userId, username, password: hashedPassword, type: 'USER' };
  }

  static async login(username: string, password: string): Promise<string> {
    if (!AuthService.db) throw new Error('AuthService not initialized');

    const user = await AuthService.db.runAndReadAll<{ id: string }>(
      'SELECT id FROM user WHERE username = ?',
      [username]
    );

    if (user.length === 0) {
      throw new Error('Invalid credentials');
    }

    const credentials = await AuthService.db.runAndReadAll<{ hash: string }>(
      'SELECT hash FROM credentials WHERE user_id = ?',
      [user[0].id]
    );

    if (credentials.length === 0) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, credentials[0].hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user[0].id }, SECRET_KEY, {
      expiresIn: '1h',
    });

    return token;
  }

  static async verifyToken(
    token: string
  ): Promise<Omit<User, 'password'> | null> {
    if (!AuthService.db) throw new Error('AuthService not initialized');

    try {
      const decodedToken = jwt.verify(token, SECRET_KEY) as { userId: string };

      const users = await AuthService.db.runAndReadAll<Omit<User, 'password'>>(
        'SELECT id, username, type FROM user WHERE id = ?',
        [decodedToken.userId]
      );

      return users.length > 0 ? users[0] : null;
    } catch (e) {
      return null;
    }
  }
}

export default AuthService;
