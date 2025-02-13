import { v4 as uuidv4 } from 'uuid';

import { Session } from '../models/session.ts';

class SessionService {
    private sessions: Session[] = [];

    async createSession(classId: string, startTime: Date, endTime: Date, professorId: string): Promise<Session> {
        if (!classId || !startTime || !endTime || !professorId) {
            throw new Error('All fields are required');
        }
        const newSession: Session = {
            id: uuidv4(),
            classId,
            startTime,
            endTime,
            professorId,
        };
        this.sessions.push(newSession);
        return newSession;
    }


    async deleteSession(sessionId: string): Promise<void> {
        const sessionIndex = this.sessions.findIndex(session => session.id === sessionId);
        if (sessionIndex === -1) {
            throw new Error('Session not found');
        }
        this.sessions.splice(sessionIndex, 1);
    }
}
export default new SessionService();