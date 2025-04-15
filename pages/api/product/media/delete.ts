import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { ProductMedia } from '../../../../model';
import logger from '../../../../lib/logger';
import { asyncHandler, AppError } from '../../../../lib/error-handler';
import fs from 'fs';
import path from 'path';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing product media delete request', {
    requestId,
    method: req.method,
    url: req.url
  });

  if (req.method !== 'DELETE') {
    logger.warn('Invalid method for product media delete endpoint', {
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
      throw new AppError(400, 'Media ID is required', 'VALIDATION_ERROR');
    }
    
    const mediaId = Number(id);
    if (isNaN(mediaId)) {
      throw new AppError(400, 'Invalid media ID format', 'VALIDATION_ERROR');
    }
    
    logger.info(`Attempting to delete product media with ID: ${mediaId}`, { requestId, mediaId });

    // Tìm product media để lấy thông tin
    const productMedia = await ProductMedia.findByPk(mediaId);
    
    if (!productMedia) {
      throw new AppError(404, 'Product media not found', 'NOT_FOUND');
    }
    
    // Lưu thông tin để log
    const { productId, url } = productMedia;
    logger.info(`Found product media to delete`, { 
      requestId, 
      mediaId, 
      productId,
      url
    });
    
    // Xóa bản ghi từ database
    await productMedia.destroy();
    
    logger.info(`Successfully deleted product media from database`, { 
      requestId, 
      mediaId,
      productId 
    });
    
    // Không xóa file vật lý vì có thể được sử dụng bởi nhiều nơi khác
    // Chỉ trả về thông báo thành công
    
    return res.status(200).json({
      success: true,
      message: 'Product media deleted successfully',
      data: { 
        id: mediaId,
        productId,
        url
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Unexpected error in product media delete endpoint', { 
      requestId, 
      id: req.query.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw new AppError(500, 'Error deleting product media', 'SERVER_ERROR');
  }
}); 