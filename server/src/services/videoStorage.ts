import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

class VideoStorage {
  private s3: S3Client;
  private accessKey: string;
  private secret: string;
  private region: string;
  private bucketName: string;

  constructor() {
    this.accessKey = process.env.ACCESS_KEY || '';
    this.secret = process.env.SECRET || '';
    this.region = process.env.REGION || '';
    this.bucketName = process.env.BUCKET_NAME || '';

    if (!this.accessKey || !this.secret || !this.region || !this.bucketName) {
      throw new Error('Missing AWS configuration in environment variables');
    }

    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.accessKey,
        secretAccessKey: this.secret,
      },
      region: this.region,
    });
  }

  async uploadVideoToAWS(video: Express.Multer.File) {
    const key = Date.now() + '_' + video.originalname;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: video.buffer,
      ContentType: 'video/mp4',
    });

    try {
      const response = await this.s3.send(command);
      const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      return { fileUrl, response };
    } catch (e: any) {
      console.error(`Failed to upload video: ${e.message}`);
      throw new Error('Failed to upload video');
    }
  }

  async generatePresignedUrl(videoKey: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: videoKey,
    });

    try {
      return await getSignedUrl(this.s3, command, { expiresIn: 60 });
    } catch (e: any) {
      console.error(`Failed to generate presigned URL: ${e.message}`);
      return null;
    }
  }
}

export default VideoStorage;
