import express from 'express';
import { login, register, verifyToken } from '../controllers/auth.ts';
import { createSession } from '../controllers/session.ts';
import {
  getClass,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/class.ts';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/verify-token', verifyToken);

router.get('/class/:id', verifyToken, getClass);
router.post('/class', verifyToken, createClass);
router.put('/class/:id', verifyToken, updateClass);
router.delete('/class/:id', verifyToken, deleteClass);

router.post('/session', verifyToken, createSession);
router.delete('/session/:id', verifyToken, deleteSession);


export default router;
