import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.ts';

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  try {
    const token = await AuthService.login(username, password);
    res.status(200).send(token);
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
  } finally {
    next();
  }
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = AuthService.verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.status(200).json({
    username: user.username,
  });
  next();
};

export { login, register, verifyToken };
