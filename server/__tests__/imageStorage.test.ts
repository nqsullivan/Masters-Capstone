import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { expect, test, describe, beforeAll, jest } from '@jest/globals';
import AuthService from '../src/services/auth';

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

// Mock AWS SDK's S3Client
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    PutObjectCommand: jest.fn(),
  };
});

describe('Image Upload Routes', () => {
  let token: string;

  beforeAll(async () => {
    // Set environment variables for AWS configuration
    process.env.ACCESS_KEY = 'mock-access-key';
    process.env.SECRET = 'mock-secret-key';
    process.env.REGION = 'mock-region';
    process.env.BUCKET_NAME = 'mock-bucket';

    // Initialize authentication service and register/login admin user
    await AuthService.init();
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');

    if (!token) {
      throw new Error('Failed to generate admin token');
    }
  });

  test('POST /upload/image should return 400 if no image file is provided', async () => {
    const response = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'No image file provided');
  });

  test('POST /upload/image should return 201 and file URL if image upload is successful', async () => {
    const response = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('test-image-content'), 'test-image.jpg');

    expect(response.status).toBe(201);
    expect(response.body.message).toHaveProperty('fileUrl');
  });
});
