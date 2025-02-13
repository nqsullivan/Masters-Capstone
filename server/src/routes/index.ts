import express from 'express';
import { login, register, verifyToken } from '../controllers/auth.ts';
import { createSession, deleteSession } from '../controllers/session.ts';
import {
  getClass,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/class.ts';
import {
  getProfessorsForClass,
  getClassesForProfessor,
  assignProfessorToClass,
  unassignProfessorFromClass,
} from '../controllers/userClassAssignment.ts';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

router.get('/class/:id', verifyToken, getClass);
router.post('/class', verifyToken, createClass);
router.put('/class/:id', verifyToken, updateClass);
router.delete('/class/:id', verifyToken, deleteClass);
router.get('/class/:class_id/professors', verifyToken, getProfessorsForClass);
router.get('/professor/:username/classes', verifyToken, getClassesForProfessor);
router.post('/class/assign', verifyToken, assignProfessorToClass);
router.post('/class/unassign', verifyToken, unassignProfessorFromClass);

router.post('/session', verifyToken, createSession);
router.delete('/session/:id', verifyToken, deleteSession);

export default router;
