import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll } from '@jest/globals';
import AuthService from '../src/services/auth';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

describe('Image Upload Routes', () => {
    let token: string;

    beforeAll(async () => {
        process.env.ACCESS_KEY = 'mock-access-key';
        process.env.SECRET = 'mock-secret-key';
        process.env.REGION = 'mock-region';
        process.env.BUCKET_NAME = 'mock-bucket';

        await AuthService.init();
        await AuthService.register('admin', 'adminpass');
        token = await AuthService.login('admin', 'adminpass');

        if (!token) {
            throw new Error('Failed to generate admin token');
        }
    });

    test('POST /upload/image should return 400 if no image file is provided', async () => {
        const response = await request(app)
            .post('/api/upload/image')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'No image file provided');
    });

});
