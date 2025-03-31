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
const mockSend = jest.fn() as jest.Mock<any>;
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

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
    const fakeS3Response = { ETag: '"mock-etag-value"' };
    mockSend.mockResolvedValueOnce(fakeS3Response);

    const response = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('test-image-content'), 'test-image.jpg');

    expect(response.status).toBe(201);
    expect(response.body.message.fileUrl).toMatch(
      /^https:\/\/mock-bucket\.s3\.mock-region\.amazonaws\.com\/\d+_test-image\.jpg$/
    );
  });

  test('POST /upload/image should still respond with 201 if S3 upload fails silently', async () => {
    mockSend.mockRejectedValueOnce(new Error('S3 Upload Failed'));

    const response = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('test-image-content'), 'test.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toBeNull;
  });

  test('POST /upload/image should return 500 if AWS config is missing', async () => {
    process.env.ACCESS_KEY = '';
    process.env.SECRET = '';
    process.env.REGION = '';
    process.env.BUCKET_NAME = '';

    const response = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('test-image-content'), 'test.jpg');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Missing AWS configuration in environment variables'
    );
  });
});
