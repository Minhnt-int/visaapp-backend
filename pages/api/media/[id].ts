import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Media } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import fs from 'fs';
import path from 'path';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing media request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  await connectToDatabase();

  const { id } = req.query;
  if (!id || isNaN(Number(id))) {
    logger.warn('Invalid media ID provided', { requestId, id });
    throw new AppError(400, 'Invalid media ID', 'VALIDATION_ERROR');
  }

  // GET - Lấy thông tin của một ảnh
  if (req.method === 'GET') {
    try {
      const media = await Media.findByPk(Number(id));
      
      if (!media) {
        logger.warn('Media not found', { requestId, id });
        throw new AppError(404, 'Media not found', 'NOT_FOUND_ERROR');
      }

      logger.info('Media retrieved successfully', {
        requestId,
        mediaId: media.id,
        filename: media.name
      });

      return res.status(200).json({
        success: true,
        data: media
      });
    } catch (error) {
      logger.error('Error retrieving media', {
        requestId,
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  // DELETE - Xóa ảnh
  else if (req.method === 'DELETE') {
    try {
      const media = await Media.findByPk(Number(id));
      
      if (!media) {
        logger.warn('Media not found', { requestId, id });
        throw new AppError(404, 'Media not found', 'NOT_FOUND_ERROR');
      }

      // Xóa file vật lý
      const filePath = path.join(process.cwd(), 'public', media.url);
      
      // Kiểm tra tồn tại file trước khi xóa
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug('Physical file deleted', { requestId, path: filePath });
      } else {
        logger.warn('Physical file not found', { requestId, path: filePath });
      }

      // Xóa bản ghi trong database
      await media.destroy();
      
      logger.info('Media deleted successfully', {
        requestId,
        mediaId: media.id,
        filename: media.name,
        url: media.url
      });

      return res.status(200).json({
        success: true,
        message: 'Media deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting media', {
        requestId,
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  // PUT - Cập nhật thông tin alt_text của ảnh
  else if (req.method === 'PUT') {
    try {
      const media = await Media.findByPk(Number(id));
      
      if (!media) {
        logger.warn('Media not found', { requestId, id });
        throw new AppError(404, 'Media not found', 'NOT_FOUND_ERROR');
      }

      const { altText } = req.body;
      
      // Cập nhật chỉ alt_text
      await media.update({ altText });
      
      logger.info('Media updated successfully', {
        requestId,
        mediaId: media.id,
        filename: media.name
      });

      return res.status(200).json({
        success: true,
        message: 'Media updated successfully',
        data: media
      });
    } catch (error) {
      logger.error('Error updating media', {
        requestId,
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  } else {
    logger.warn('Invalid method for media endpoint', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET', 'DELETE', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}); 