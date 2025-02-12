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
}

export default new SessionService();