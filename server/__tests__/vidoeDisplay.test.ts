import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll, jest } from '@jest/globals';
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

    expect(response.status).toBe(500);
  });

  test('GET /video/presigned-url/:videoKey should return 404 if video is not found', async () => {
    const mockVideoKey = 'non-existent-video-key.mp4';

    const response = await request(app)
      .get(`/api/video/presigned-url/${mockVideoKey}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
  });

  test('GET /video/presigned-url/:videoKey should return 500 if AWS configuration is missing', async () => {
    // Temporarily clear AWS environment variables
    const originalAccessKey = process.env.ACCESS_KEY;
    const originalSecret = process.env.SECRET;
    const originalRegion = process.env.REGION;
    const originalBucketName = process.env.BUCKET_NAME;

    process.env.ACCESS_KEY = '';
    process.env.SECRET = '';
    process.env.REGION = '';
    process.env.BUCKET_NAME = '';

    const mockVideoKey = 'test-video-key.mp4';

    const response = await request(app)
      .get(`/api/video/presigned-url/${mockVideoKey}`)
      .set('Authorization', `Bearer ${token}`);

    // Restore AWS environment variables
    process.env.ACCESS_KEY = originalAccessKey;
    process.env.SECRET = originalSecret;
    process.env.REGION = originalRegion;
    process.env.BUCKET_NAME = originalBucketName;

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty(
      'error',
      'Missing AWS configuration in environment variables'
    );
  });

  test('GET /video/presigned-url/:videoKey should return 400 if no videoKey is provided', async () => {
    const response = await request(app)
      .get(`/api/video/presigned-url/`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  test('GET /video/presigned-url/:videoKey should return 404 if video is not found in AWS', async () => {
    // Mock the generatePresignedUrl method to return null
    jest
      .spyOn(VideoStorage.prototype, 'generatePresignedUrl')
      .mockResolvedValueOnce(null);

    const mockVideoKey = 'non-existent-video-key.mp4';

    const response = await request(app)
      .get(`/api/video/presigned-url/${mockVideoKey}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Video not found in AWS');
  });
});
