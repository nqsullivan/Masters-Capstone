import { expect, test, describe, beforeAll, jest } from '@jest/globals';
// Mock the VideoStorage service
jest.mock('../src/services/videoStorage', () => {
  return jest.fn().mockImplementation(() => ({
    generatePresignedUrl: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve('https://mock-presigned-url.com')
      ),
  }));
});
import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import AuthService from '../src/services/auth';
import VideoStorage from '../src/services/videoStorage';

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

describe('Video Display Routes', () => {
  let token: string;

  beforeAll(async () => {
    // Initialize authentication service and register/login admin user
    await AuthService.init();
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  test('GET /video/presigned-url/:videoKey should return a pre-signed video URL', async () => {
    const mockVideoKey = 'test-video-key.mp4';

    const response = await request(app)
      .get(`/api/video/presigned-url/${mockVideoKey}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
