import express from 'express';
import { login, register, verifyToken } from '../controllers/auth.ts';
import {
  createSession,
  deleteSession,
  getSession,
  updateSession,
  getStudentsForSession,
} from '../controllers/session.ts';
import {
  addStudentsToSession,
  deleteStudentFromSession,
} from '../controllers/studentSessionAssignment.ts';
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
import { getLog, createLog, deleteLog } from '../controllers/log.ts';

import {
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/student.ts';

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

//classId, startTime, endTime, professorId
router.post('/session', verifyToken, createSession);
router.delete('/session/:id', verifyToken, deleteSession);
router.get('/session/:id', verifyToken, getSession);
router.put('/session/:id', verifyToken, updateSession);
router.get('/session/:sessionId/students', verifyToken, getStudentsForSession);

//studentId, sessionId
router.post('/session/:sessionId/students', verifyToken, addStudentsToSession);
router.delete(
  '/session/:sessionId/students/:studentId',
  verifyToken,
  deleteStudentFromSession
);
router.get('/student/:id', verifyToken, getStudent);
router.post('/student', verifyToken, createStudent);
router.put('/student/:id', verifyToken, updateStudent);
router.delete('/student/:id', verifyToken, deleteStudent);

router.get('/log/:id', verifyToken, getLog);
router.post('/log', verifyToken, createLog);
router.delete('/log/:id', verifyToken, deleteLog);

export default router;
