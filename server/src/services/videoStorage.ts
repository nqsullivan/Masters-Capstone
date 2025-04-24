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

    async generatePresignedUrl(imageKey: string) {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: imageKey,
        });
    
        try {
          return await getSignedUrl(this.s3, command, { expiresIn: 60 });
        } catch (e) {
          console.error(`Failed to generate presigned URL: ${e}`);
          return null;
        }
    }
  }

  export default VideoStorage;