import { v4 as uuidv4 } from 'uuid';
import DatabaseAccess from '../services/database.ts';
import { Session } from '../models/session.ts';

class SessionService {
    private db!: DatabaseAccess;

    constructor() {
        this.init();
    }

    private async init() {
        this.db = await DatabaseAccess.getInstance();
    }

    async createSession(classId: string, startTime: Date, endTime: Date, professorId: string): Promise<Session> {
        if (!classId || !startTime || !endTime || !professorId) {
            throw new Error('All fields are required');
        }
        const id = uuidv4();

        await this.db.runWithNoReturned(
            `INSERT INTO session (id, start_time, end_time, class_id, professor_id) VALUES (?, ?, ?, ?, ?)`,
            [id, startTime, endTime, classId, professorId]
        );

        return { id, startTime, endTime, classId,professorId };
    }

    async getSession(sessionId: string): Promise<Session> {
        const result = await this.db.runAndReadAll<Session>(
            `SELECT id, start_time, end_time, class_id, professor_id FROM session WHERE id = ?`,
            [sessionId]
        );

        if (result.length > 0) {
            const session = result[0];
            session.startTime = new Date(session.startTime);
            session.endTime = new Date(session.endTime);
            return session;
        }
        throw new Error('Session not found');
    }

    async deleteSession(sessionId: string): Promise<void> {
        const existingSession = await this.getSession(sessionId);
        if (!existingSession) {
            throw new Error('Session not found');
        }

        await this.db.runWithNoReturned(`DELETE FROM session WHERE id = ?`, [sessionId]);
    }
}

export default new SessionService();