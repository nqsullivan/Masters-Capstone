import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class ImageStorage {
  private s3: S3Client;

  constructor() {
    if (!process.env.ACCESS_KEY || !process.env.SECRET || !process.env.REGION) {
      throw new Error('Missing AWS configuration in environment variables');
    }

    this.s3 = new S3Client({
      credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET,
      },
      region: process.env.REGION,
    });
  }

  async uploadImageToAWS(file: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
  }) {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: Date.now() + '_' + file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    console.log('Uploading image to AWS S3');

    try {
      const response = await this.s3.send(new PutObjectCommand(params));
      const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${params.Key}`;
      return { fileUrl, response };
    } catch (e: any) {
      console.log(e.message);
    }
  }
}

export default ImageStorage;
