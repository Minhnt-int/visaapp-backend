import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product } from '../../../model';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();

  const { id } = req.query;

  if (!id) {
    throw new AppError(400, 'Product ID is required', 'VALIDATION_ERROR');
  }

  logger.info(`Attempting to permanently delete product with ID: ${id}`);

  try {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new AppError(404, 'Product not found', 'NOT_FOUND');
    }

    // Xóa vĩnh viễn sản phẩm và tất cả các quan hệ liên quan (cascade)
    await product.destroy();

    logger.info(`Successfully permanently deleted product with ID: ${id}`);

    return res.status(200).json({
      message: 'Product permanently deleted successfully',
      data: { id }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Error permanently deleting product', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: id 
    });
    
    throw new AppError(500, 'Failed to permanently delete product', 'INTERNAL_SERVER_ERROR');
  }
}); 