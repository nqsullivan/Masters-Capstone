import { Request, Response, NextFunction } from 'express';
import ImageStorage from '../services/imageStorage.js';

const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = req.file;
    if (!image) {
      throw res.status(400).json({ error: 'No image file provided' });
    }
    const ImageStorageInstance = new ImageStorage();

    const savedImage = await ImageStorageInstance.uploadImageToAWS(image);

    res.status(201).json({ message: savedImage });
    next();
  } catch (e: any) {
    if (e.message === 'No image file provided') {
      res.status(400).json({ error: e.message });
    } else if (e.message === 'Missing AWS configuration in environment variables') {
      res.status(500).json({ error: e.message });
    }
  }
};

export { uploadImage };
