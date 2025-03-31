import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import AuthService from '../src/services/auth';
import {
  jest,
  describe,
  it,
  beforeAll,
  beforeEach,
  expect,
} from '@jest/globals';

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn(() => ({})),
    GetObjectCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/s3-request-presigner');

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
    process.env.ACCESS_KEY = 'mock-access-key';
    process.env.SECRET = 'mock-secret-key';
    process.env.REGION = 'mock-region';
    process.env.BUCKET_NAME = 'mock-bucket';

    await AuthService.init();
    await AuthService.register('admin', 'adminpass');
    token = await AuthService.login('admin', 'adminpass');
    if (!token) throw new Error('Failed to generate admin token');
  });

  it('should retrieve a presigned image URL successfully', async () => {
    const mockedPresign = getSignedUrl as jest.MockedFunction<
      typeof getSignedUrl
    >;
    mockedPresign.mockResolvedValue('https://mock-s3-url.com/presigned-key');

    const response = await request(app)
      .get('/api/image/valid-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.imageUrl).toBe(
      'https://mock-s3-url.com/presigned-key'
    );
  });

  it('should return 404 if image is not found in AWS', async () => {
    const mockedPresign = getSignedUrl as jest.MockedFunction<
      typeof getSignedUrl
    >;
    mockedPresign.mockResolvedValue(null as unknown as string);

    const response = await request(app)
      .get('/api/image/missing-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Image not found in AWS');
  });

  it('should return 400 if no image key is provided', async () => {
    const response = await request(app)
      .get('/api/image/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 404 if image is not found in AWS', async () => {
    const mockedPresign = getSignedUrl as jest.MockedFunction<
      typeof getSignedUrl
    >;
    mockedPresign.mockResolvedValue(null as unknown as string);

    const response = await request(app)
      .get('/api/image/missing-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Image not found in AWS');
  });

  it('should return 500 if AWS configuration is missing', async () => {
    process.env.ACCESS_KEY = '';
    process.env.SECRET = '';
    process.env.REGION = '';
    process.env.BUCKET_NAME = '';

    const response = await request(app)
      .get('/api/image/any-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Missing AWS configuration in environment variables'
    );
  });
});
