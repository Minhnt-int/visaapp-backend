import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Media } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';

// Thêm media từ bên ngoài vào database
export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing external media request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  await connectToDatabase();

  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    logger.warn('Invalid method for external media endpoint', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['POST']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  try {
    // Lấy dữ liệu từ request body
    const { name, path, type, altText } = req.body;

    // Validate dữ liệu
    if (!name || !path) {
      logger.warn('Missing required fields for external media', {
        requestId,
        body: req.body
      });
      throw new AppError(400, 'Name and path are required', 'VALIDATION_ERROR');
    }

    // Kiểm tra type hợp lệ
    if (type && !['image', 'video'].includes(type)) {
      logger.warn('Invalid media type', {
        requestId,
        type
      });
      throw new AppError(400, 'Type must be either "image" or "video"', 'VALIDATION_ERROR');
    }

    // Tạo media mới
    const media = await Media.create({
      name,
      path,
      type: type || 'image', // Mặc định là image nếu không được chỉ định
      altText: altText || '',
    });

    logger.info('External media added successfully', {
      requestId,
      mediaId: media.id,
      name: media.name,
      path: media.path,
      type: media.type
    });

    // Trả về thông tin media đã tạo
    return res.status(201).json({
      success: true,
      message: 'External media added successfully',
      data: media
    });
  } catch (error) {
    logger.error('Error adding external media', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}); 