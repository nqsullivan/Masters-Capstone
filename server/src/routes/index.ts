import express from 'express';
import { login, register, verifyToken } from '../controllers/auth.js';
import {
  createSession,
  deleteSession,
  getSession,
  updateSession,
  addAttendanceRecord,
  modifyAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceRecordsForProfessorPaged,
  getAttendanceRecordsForSession,
} from '../controllers/session.js';
import {
  addStudentsToClass,
  getStudentsForClass,
  deleteStudentFromClass,
} from '../controllers/studentClassAssignment.js';
import {
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassPage,
  getSessionsForClass,
  getSchedulesForRoomNumber,
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
import { getAttendanceRecord } from '../controllers/attendance.js';
import { generatePresignedVideoUrl } from '../controllers/videoStorage.js';

const router = express.Router();

// Auth routes
router.post('/login', login);
router.post('/register', register);

// Attendance routes
router.get('/attendance', verifyToken, getAttendanceRecordsForProfessorPaged);
router.get('/attendance/:id', verifyToken, getAttendanceRecord);
router.put('/attendance/:attendanceId', verifyToken, modifyAttendanceRecord);

// Class routes
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
router.delete(
  '/class/:classId/student/:studentId',
  verifyToken,
  deleteStudentFromClass
);

router.get('/schedule/:roomNumber', verifyToken, getSchedulesForRoomNumber);

// Session routes
router.post('/session', verifyToken, createSession);
router.delete('/session/:id', verifyToken, deleteSession);
router.get('/session/:id', verifyToken, getSession);
router.put('/session/:id', verifyToken, updateSession);
router.post('/session/:sessionId/attendance', verifyToken, addAttendanceRecord);
router.delete(
  '/session/:sessionId/attendance/:attendanceId',
  verifyToken,
  deleteAttendanceRecord
);
router.get(
  '/session/:sessionId/attendance',
  verifyToken,
  getAttendanceRecordsForSession
);

// Student routes
router.get('/student/:id', verifyToken, getStudent);
router.get('/students', verifyToken, getStudentPage);
router.post('/student', verifyToken, createStudent);
router.put('/student/:id', verifyToken, updateStudent);
router.delete('/student/:id', verifyToken, deleteStudent);

// Log routes
router.get('/log/:id', verifyToken, getLog);
router.post('/log', verifyToken, createLog);
router.delete('/log/:id', verifyToken, deleteLog);
router.get('/logs', verifyToken, getLogsPaginated);

// Image routes
router.post('/image', verifyToken, upload.single('image'), uploadImage);
router.get('/image/:imageKey', verifyToken, retrieveImage);

//video routes
router.get('/video/presigned-url/:videoKey', verifyToken, generatePresignedVideoUrl);

// Dashboard routes
router.get('/dashboard/:classId', verifyToken, getDashboardData);

export default router;
