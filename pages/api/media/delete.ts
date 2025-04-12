import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';
import { QueryTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing media delete request', {
    requestId,
    method: req.method,
    url: req.url
  });

  if (req.method !== 'DELETE') {
    logger.warn('Invalid method for media delete endpoint', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectToDatabase();

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Media ID is required'
      });
    }
    
    const mediaId = Number(id);
    if (isNaN(mediaId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid media ID format'
      });
    }
    
    logger.info(`Attempting to delete media with ID: ${mediaId}`, { requestId, mediaId });

    // Lấy thông tin về media (bao gồm url) trước khi xóa
    const mediaData = await sequelize.query(
      `SELECT id, name, url, type FROM media WHERE id = :id`,
      {
        replacements: { id: mediaId },
        type: QueryTypes.SELECT,
        plain: true
      }
    );
    
    if (!mediaData) {
      logger.warn(`Media with ID ${mediaId} not found for deletion`, { requestId, mediaId });
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    // Lưu thông tin đường dẫn để xóa file sau
    const mediaUrl = (mediaData as any).url;
    
    // Xóa bản ghi từ database
    await sequelize.query(
      `DELETE FROM media WHERE id = :id`,
      {
        replacements: { id: mediaId },
        type: QueryTypes.DELETE
      }
    );
    
    logger.info(`Successfully deleted media record with ID: ${mediaId}`, { requestId, mediaId });
    
    // Xóa file sau khi đã xóa bản ghi thành công
    if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim() !== '') {
      try {
        // Xử lý đường dẫn và lấy tên file
        let filename = '';
        
        if (mediaUrl.includes('/')) {
          // Lấy phần tử cuối cùng của đường dẫn (tên file)
          const parts = mediaUrl.split('/');
          filename = parts[parts.length - 1];
        } else {
          filename = mediaUrl;
        }
        
        if (filename) {
          // Đường dẫn đầy đủ đến file
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          const filePath = path.join(uploadsDir, filename);
          
          logger.info(`Attempting to delete file: ${filePath}`, { requestId, mediaId });
          
          // Kiểm tra file có tồn tại không trước khi xóa
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`Successfully deleted file: ${filePath}`, { requestId, mediaId });
          } else {
            logger.warn(`File not found on disk: ${filePath}`, { requestId, mediaId });
          }
        }
      } catch (fileError) {
        // Chỉ log lỗi, không ảnh hưởng đến kết quả API vì đã xóa DB thành công
        logger.error(`Error deleting file for media ${mediaId}`, {
          requestId,
          mediaId,
          path: mediaUrl,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
      data: { id: mediaId }
    });
  } catch (error) {
    logger.error('Error in media delete endpoint', { 
      requestId, 
      id: req.query.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error deleting media',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}); 