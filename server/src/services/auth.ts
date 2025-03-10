import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import DatabaseAccess from './database.js';
import { User } from '../models/user.js';
import UserService, { UserNotFoundError } from './user.js';

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
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    let existingUser;
    try {
      existingUser = await UserService.getUser(username);
      throw new Error('Username already taken');
    } catch (error) {
      if (!(error instanceof UserNotFoundError)) {
        throw error;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await UserService.insertUser({ username, type: 'USER' });

    await AuthService.db.runWithNoReturned(
      'INSERT INTO credential (username, hash) VALUES (?, ?)',
      [username, hashedPassword]
    );

    return { username, type: 'USER' };
  }

  static async login(username: string, password: string): Promise<string> {
    let user;
    try {
      user = await UserService.getUser(username);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new Error('Invalid credentials');
      }

      throw error;
    }

    const credentials = await AuthService.db.runAndReadAll<{ hash: string }>(
      'SELECT hash FROM credential WHERE username = ?',
      [username]
    );

    const isValid = await bcrypt.compare(password, credentials[0].hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, {
      expiresIn: '1h',
    });

    return token;
  }

  static async verifyToken(
    token: string
  ): Promise<Omit<User, 'password'> | null> {
    try {
      const decodedToken = jwt.verify(token, SECRET_KEY) as {
        username: string;
      };

      return await UserService.getUser(decodedToken.username);
    } catch (e) {
      return null;
    }
  }
}

export default AuthService;
