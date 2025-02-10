import express from 'express';
import { login, register, verifyToken } from '../controllers/auth.ts';
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
router.patch('/class/:id', verifyToken, updateClass);
router.delete('/class/:id', verifyToken, deleteClass);

export default router;
