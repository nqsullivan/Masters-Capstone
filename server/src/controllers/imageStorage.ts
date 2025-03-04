import { Request, Response, NextFunction } from 'express';
import ImageStorage from '../services/imageStorage.js';

const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = req.file;
    if (!image) {
      throw new Error('No image file provided');
    }
    const ImageStorageInstance = new ImageStorage();

    const savedImage = await ImageStorageInstance.uploadImageToAWS(image);

    res.status(201).json({ message: savedImage });
    next();
  } catch (e: any) {
    if (e.message === 'No image file provided') {
      res.status(400).json({ error: e.message });
    } else if (
      e.message === 'Missing AWS configuration in environment variables'
    ) {
      res.status(500).json({ error: e.message });
    }
  }
};

const retrieveImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { imageKey } = req.params;
        if (!imageKey) {
            throw new Error('No image key provided');
        }
        const ImageStorageInstance = new ImageStorage();

        const imageResponse = await ImageStorageInstance.downloadImageFromAWS(imageKey);
        if (imageResponse) {
            res.setHeader('Content-Type', imageResponse.contentType);
            const image = imageResponse.image;
            image.pipe(res);
        } else {
            throw new Error('Image not found in AWS');
        }
       
        next();
    } catch (e: any) {
        if (e.message === 'No image key provided') {
            res.status(400).json({ error: e.message });
        } else if (
            e.message === 'Image not found in AWS'
        ) {
            res.status(404).json({ error: e.message });
        }  else if (
            e.message === 'Missing AWS configuration in environment variables'
          ) {
            res.status(500).json({ error: e.message });
          }
    }
};

export { uploadImage, retrieveImage };