import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductStatus } from '../../../model';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();

  const { id } = req.body;

  if (!id) {
    throw new AppError(400, 'Product ID is required', 'VALIDATION_ERROR');
  }

  logger.info(`Attempting to activate product with ID: ${id}`);

  try {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new AppError(404, 'Product not found', 'NOT_FOUND');
    }

    // Nếu sản phẩm đã được kích hoạt rồi
    if (product.status === ProductStatus.ACTIVE) {
      return res.status(200).json({ 
        message: 'Product is already active',
        data: { id, status: ProductStatus.ACTIVE }
      });
    }

    // Nếu sản phẩm đã bị xóa
    if (product.status === ProductStatus.DELETED) {
      throw new AppError(400, 'Cannot activate deleted product', 'INVALID_OPERATION');
    }

    // Cập nhật trạng thái thành ACTIVE
    await product.update({ status: ProductStatus.ACTIVE });

    logger.info(`Successfully activated product with ID: ${id}`);

    return res.status(200).json({
      message: 'Product activated successfully',
      data: {
        id,
        status: ProductStatus.ACTIVE
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Error activating product', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: id 
    });
    
    throw new AppError(500, 'Failed to activate product', 'INTERNAL_SERVER_ERROR');
  }
}); 