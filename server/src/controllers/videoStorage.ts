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

    const videoStorageInstance = new VideoStorage();
    const videoResponse =
      await videoStorageInstance.generatePresignedUrl(videoKey);

    if (!videoResponse) {
      throw new Error('Video not found in AWS');
    }

    res.status(200).json({ videoUrl: videoResponse });
    next();
  } catch (e: any) {
    if (
      e.message === 'No video key provided' ||
      e.message === 'Video not found in AWS'
    ) {
      res.status(404).json({ error: e.message });
    } else if (
      e.message === 'Missing AWS configuration in environment variables'
    ) {
      res.status(500).json({ error: e.message });
    }
  }
};

const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const video = req.file;
    if (!video) {
      throw new Error('No video file provided');
    }

    const videoStorageInstance = new VideoStorage();
    const savedVideo = await videoStorageInstance.uploadVideoToAWS(video);

    res.status(201).json(savedVideo);
    next();
  } catch (e: any) {
    if (e.message === 'No video file provided') {
      res.status(400).json({ error: e.message });
    } else if (
      e.message === 'Missing AWS configuration in environment variables'
    ) {
      res.status(500).json({ error: e.message });
    }
  }
};

export { generatePresignedVideoUrl, uploadVideo };
