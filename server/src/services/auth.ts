import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import DatabaseAccess from './database.ts';
import { User } from '../models/user.ts';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

class AuthService {
  private static db: DatabaseAccess;

  private constructor() {}

  static async init() {
    if (!AuthService.db) {
      AuthService.db = await DatabaseAccess.getInstance();
    }
  }

  static async register(username: string, password: string): Promise<User> {
    if (!AuthService.db) throw new Error('AuthService not initialized');

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const existingUsers = await AuthService.db.runAndReadAll<{
      username: string;
    }>('SELECT username FROM user WHERE username = ?', [username]);

    if (existingUsers.length > 0) {
      throw new Error('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await AuthService.db.runWithNoReturned(
      'INSERT INTO user (username, type) VALUES (?, ?)',
      [username, 'USER']
    );

    await AuthService.db.runWithNoReturned(
      'INSERT INTO credential (username, hash) VALUES (?, ?)',
      [username, hashedPassword]
    );

    return { username, password: hashedPassword, type: 'USER' };
  }

  static async login(username: string, password: string): Promise<string> {
    if (!AuthService.db) throw new Error('AuthService not initialized');

    const user = await AuthService.db.runAndReadAll<{ username: string }>(
      'SELECT username FROM user WHERE username = ?',
      [username]
    );

    if (user.length === 0) {
      throw new Error('Invalid credentials');
    }

    const credentials = await AuthService.db.runAndReadAll<{ hash: string }>(
      'SELECT hash FROM credential WHERE username = ?',
      [username]
    );

    if (credentials.length === 0) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, credentials[0].hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ username: user[0].username }, SECRET_KEY, {
      expiresIn: '1h',
    });

    return token;
  }

  static async verifyToken(
    token: string
  ): Promise<Omit<User, 'password'> | null> {
    if (!AuthService.db) throw new Error('AuthService not initialized');

    try {
      const decodedToken = jwt.verify(token, SECRET_KEY) as {
        username: string;
      };

      const users = await AuthService.db.runAndReadAll<Omit<User, 'password'>>(
        'SELECT username, type FROM user WHERE username = ?',
        [decodedToken.username]
      );

      return users.length > 0 ? users[0] : null;
    } catch (e) {
      return null;
    }
  }
}

export default AuthService;
