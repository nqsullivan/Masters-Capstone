import express from 'express';
import { login, register, verifyToken } from '../controllers/auth.js';
import {
  createSession,
  deleteSession,
  getSession,
  updateSession,
  getStudentsForSession,
  addAttendanceRecord,
} from '../controllers/session.js';
import {
  addStudentsToSession,
  deleteStudentFromSession,
} from '../controllers/studentSessionAssignment.js';
import {
  addStudentsToClass,
  getStudentsForClass,
} from '../controllers/studentClassAssignment.js';
import {
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassPage,
  getSessionsForClass,
} from '../controllers/class.js';
import {
  getProfessorsForClass,
  assignProfessorToClass,
  unassignProfessorFromClass,
} from '../controllers/userClassAssignment.js';
import {
  getLog,
  createLog,
  deleteLog,
  getLogsPaginated,
} from '../controllers/log.js';

import {
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPage,
} from '../controllers/student.js';
import upload from '../middleware/upload-middleware.js';
import { uploadImage, retrieveImage } from '../controllers/imageStorage.js';
import { getDashboardData } from '../controllers/dashboard.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

router.get('/class/:id', verifyToken, getClass);
router.get('/classes', verifyToken, getClassPage);
router.post('/class', verifyToken, createClass);
router.put('/class/:id', verifyToken, updateClass);
router.delete('/class/:id', verifyToken, deleteClass);
router.get(`/class/:classId/sessions`, verifyToken, getSessionsForClass);
router.get('/class/:classId/professors', verifyToken, getProfessorsForClass);
router.post('/class/assign', verifyToken, assignProfessorToClass);
router.post('/class/unassign', verifyToken, unassignProfessorFromClass);
router.post('/class/:classId/students', verifyToken, addStudentsToClass);
router.get('/class/:classId/students', verifyToken, getStudentsForClass);

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
router.post('/session/:sessionId/attendance', verifyToken, addAttendanceRecord);

router.get('/student/:id', verifyToken, getStudent);
router.get('/students', verifyToken, getStudentPage);
router.post('/student', verifyToken, createStudent);
router.put('/student/:id', verifyToken, updateStudent);
router.delete('/student/:id', verifyToken, deleteStudent);

router.get('/log/:id', verifyToken, getLog);
router.post('/log', verifyToken, createLog);
router.delete('/log/:id', verifyToken, deleteLog);
router.get('/logs', verifyToken, getLogsPaginated);

router.post('/image', verifyToken, upload.single('image'), uploadImage);
router.get('/image/:imageKey', verifyToken, retrieveImage);

// Dashboard
router.get('/dashboard/:classId', verifyToken, getDashboardData);

export default router;
