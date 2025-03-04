import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import AuthService from '../src/services/auth';

jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn(() => ({
      send: mockSend,
    })),
    GetObjectCommand: jest.fn(),
    mockSend,
  };
});

const { mockSend } = require('@aws-sdk/client-s3');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

describe('Image Retrieval Routes', () => {
  let token: string;
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('should retrieve an image successfully', async () => {
    const imageStream = new Readable();
    imageStream.push('image content');
    imageStream.push(null);

    mockSend.mockResolvedValue({
      Body: imageStream,
      ContentType: 'image/jpeg',
    });

    const response = await request(app)
      .get('/api/retrieve/image/valid-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/jpeg');
  });

  it('should return 404 if no image key is provided', async () => {
    const response = await request(app)
      .get('/api/retrieve/image/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 404 if image is not found in AWS', async () => {
    mockSend.mockResolvedValue({
      Body: null,
      ContentType: null,
    });

    const response = await request(app)
      .get('/api/retrieve/image/missing-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Image not found in AWS');
  });

  it('should return 500 if there is a missing AWS configuration', async () => {
    process.env.ACCESS_KEY = '';
    process.env.SECRET = '';
    process.env.REGION = '';
    process.env.BUCKET_NAME = '';

    const response = await request(app)
      .get('/api/retrieve/image/any-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Missing AWS configuration in environment variables'
    );
  });
});
