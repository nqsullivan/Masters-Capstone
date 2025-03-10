import DatabaseAccess from '../services/database.js';
import { User } from '../models/user.js';

export class UserNotFoundError extends Error {
  constructor(username: string) {
    super(`User with username '${username}' not found`);
  }
}

class UserService {
  private db!: DatabaseAccess;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await DatabaseAccess.getInstance();
  }

  async getUser(username: string): Promise<User> {
    const result = await this.db.runAndReadAll<User>(
      `SELECT username FROM User WHERE username = ?`,
      [username]
    );

    if (result.length > 0) {
      return result[0];
    }
    throw new UserNotFoundError(username);
  }

  async insertUser(user: User): Promise<User> {
    try {
      await this.getUser(user.username);
      throw new Error(`User with username '${user.username}' already exists`);
    } catch (error) {
      if (!(error instanceof UserNotFoundError)) {
        throw error;
      }
    }

    await this.db.runWithNoReturned(
      `INSERT INTO User (username, type) VALUES (?, ?)`,
      [user.username, user.type]
    );

    return user;
  }
}

export default new UserService();
