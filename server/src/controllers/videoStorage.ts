import { Request, Response, NextFunction } from 'express';
import VideoStorage from '../services/videoStorage.js';

const generatePresignedVideoUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { videoKey } = req.params;
    if (!videoKey) {
      throw new Error('No video key provided');
    }

    const VideoStorageInstance = new VideoStorage();

    const videoResponse =
      await VideoStorageInstance.generatePresignedUrl(videoKey);

    if (!videoResponse) {
      throw new Error('Video not found in AWS');
    }

    res.status(200).json({ videoUrl: videoResponse });

    next();
  } catch (e: any) {
    if (e.message === 'No video key provided') {
      res.status(404).json({ error: e.message });
    } else if (e.message === 'Video not found in AWS') {
      res.status(404).json({ error: e.message });
    } else if (
      e.message === 'Missing AWS configuration in environment variables'
    ) {
      res.status(500).json({ error: e.message });
    }
  }
};

export { generatePresignedVideoUrl };
