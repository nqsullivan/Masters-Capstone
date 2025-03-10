import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.js';

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  try {
    const token = await AuthService.login(username, password);
    res.status(200).json({ token });
    next();
  } catch (e: any) {
    res.status(401).json({ error: 'Invalid credentials' }) && next(e);
  }
};

const register = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  try {
    const user = await AuthService.register(username, password);
    res.status(201).json({ username: user.username });
  } catch (e: any) {
    const status = e.message === 'Username already taken' ? 400 : 500;
    res.status(status).json({ error: e.message });
  }
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await AuthService.verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

export { login, register, verifyToken };
