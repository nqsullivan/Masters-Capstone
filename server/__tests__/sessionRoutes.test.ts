import request from 'supertest';
import express from 'express';
import routes from '../routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';
import TestUtils from './utils';

const app = express();
app.use(express.json());
app.use('/api', routes);

let token: string | null = '';

beforeAll(async () => {
    token = await TestUtils.getValidToken();
});

describe('Session Routes', () => {
    const mockStartTime = new Date('2023-01-01T10:00:00Z').toISOString();
    const mockEndTime = new Date('2023-01-01T11:00:00Z').toISOString();

    test('POST /session should create a new session', async () => {
        const sessionData = {
            classId: 'fakeClassId',
            startTime: mockStartTime,
            endTime: mockEndTime,
            professorId: 'fakeProfId'
        };

        const response = await request(app)
            .post('/api/session')
            .set('Authorization', `Bearer ${token}`)
            .send(sessionData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
    });

    test('DELETE /session/:id should delete a session', async () => {
        // create a session 
        const sessionData = {
            classId: 'fakeClassId',
            startTime: mockStartTime,
            endTime: mockEndTime,
            professorId: 'fakeProfId'
        };

        const createResponse = await request(app)
            .post('/api/session')
            .set('Authorization', `Bearer ${token}`)
            .send(sessionData);

        const sessionId = createResponse.body.id;

        // delete the created session
        const deleteResponse = await request(app)
            .delete(`/api/session/${sessionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteResponse.status).toBe(204);
    });

    // Failure scenario: delete a session that does not exist
    test('DELETE /session/:id should return 404 if session does not exist', async () => {
        const SessionId = 'fakeSessionId';

        const response = await request(app)
            .delete(`/api/session/${SessionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
    });
});


