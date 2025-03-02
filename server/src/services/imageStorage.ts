import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class ImageStorage {
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

  async uploadImageToAWS(file: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
  }) {
    const params = {
      Bucket: this.bucketName,
      Key: Date.now() + '_' + file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const response = await this.s3.send(new PutObjectCommand(params));
      const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${params.Key}`;
      return { fileUrl, response };
    } catch (e: any) {
      console.log(e.message);
    }
  }
}

export default ImageStorage;
