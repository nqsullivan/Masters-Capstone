import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { User } from '../models/user.ts';

const SECRET_KEY = 'notasecret';

class AuthService {
  private users: User[] = [];

  async register(username: string, password: string): Promise<User> {
    console.log(`Registering user: ${username} with password: ${password}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
    };
    this.users.push(newUser);
    return newUser;
  }

  async login(username: string, password: string): Promise<string | null> {
    const user = this.users.find((user) => user.username === username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY,
        { expiresIn: '1h' }
      );
      return token;
    }
    return null;
  }

  verifyToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, SECRET_KEY) as User;
      return this.users.find((user) => user.id === decoded.id) || null;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
