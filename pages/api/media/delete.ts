import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';
import { QueryTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

/**
 * Helper function để xóa file media từ hệ thống file
 */
async function deleteMediaFile(mediaUrl: string, requestId: string, mediaId: number): Promise<void> {
  if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
    logger.warn('No valid media URL provided for file deletion', { requestId, mediaId });
    return;
  }

  try {
    let filename: string;
    
    // Xử lý các dạng URL khác nhau
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      // URL đầy đủ - lấy phần filename từ path
      const urlObj = new URL(mediaUrl);
      filename = path.basename(urlObj.pathname);
    } else if (mediaUrl.startsWith('/uploads/')) {
      // Relative path từ public - lấy filename
      filename = path.basename(mediaUrl);
    } else if (mediaUrl.includes('/')) {
      // Path với directory segments
      const parts = mediaUrl.split('/');
      filename = parts[parts.length - 1];
    } else {
      // Direct filename
      filename = mediaUrl;
    }
    
    // Validate filename
    if (!filename || filename === '.' || filename === '..') {
      logger.warn('Invalid filename extracted from URL', { requestId, mediaId, mediaUrl, filename });
      return;
    }
    
    // Tạo đường dẫn đến file
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Kiểm tra cả 2 thư mục uploads và public/uploads
    const possiblePaths = [
      path.join(uploadsDir, filename),
      path.join(publicUploadsDir, filename)
    ];
    
    let fileDeleted = false;
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          // Kiểm tra quyền trước khi xóa
          fs.accessSync(filePath, fs.constants.F_OK | fs.constants.W_OK);
          fs.unlinkSync(filePath);
          logger.info(`Successfully deleted file: ${filePath}`, { requestId, mediaId });
          fileDeleted = true;
          break;
        } catch (accessError) {
          logger.error(`No permission to delete file: ${filePath}`, {
            requestId,
            mediaId,
            error: accessError instanceof Error ? accessError.message : 'Unknown error'
          });
        }
      }
    }
    
    if (!fileDeleted) {
      logger.warn('File not found in any expected location', { 
        requestId, 
        mediaId, 
        mediaUrl, 
        filename,
        searchedPaths: possiblePaths 
      });
    }
    
  } catch (fileError) {
    // Log lỗi nhưng không throw để không ảnh hưởng đến việc xóa DB
    logger.error(`Error deleting file for media ${mediaId}`, {
      requestId,
      mediaId,
      url: mediaUrl,
      error: fileError instanceof Error ? fileError.message : 'Unknown error'
    });
  }
}

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = Array.isArray(req.headers['x-request-id']) 
    ? req.headers['x-request-id'][0] 
    : req.headers['x-request-id'] || Date.now().toString();
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
    const [mediaResult] = await sequelize.query(
      `SELECT id, name, url, type FROM media WHERE id = :id`,
      {
        replacements: { id: mediaId },
        type: QueryTypes.SELECT
      }
    );
    
    if (!mediaResult) {
      logger.warn(`Media with ID ${mediaId} not found for deletion`, { requestId, mediaId });
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    // Lưu thông tin đường dẫn để xóa file sau
    const mediaUrl = (mediaResult as any).url;
    
    // Xóa bản ghi từ database
    await sequelize.query(
      `DELETE FROM media WHERE id = :id`,
      {
        replacements: { id: mediaId },
        type: QueryTypes.DELETE
      }
    );
    
    logger.info(`Successfully deleted from database`, { 
      requestId, 
      mediaId,
      url: mediaUrl,
    });
    
    // Xóa file sau khi đã xóa bản ghi thành công
    if (mediaUrl) {
      await deleteMediaFile(String(mediaUrl), requestId, mediaId);
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