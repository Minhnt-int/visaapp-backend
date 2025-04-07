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

  logger.info(`Attempting to soft delete product with ID: ${id}`);

  try {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new AppError(404, 'Product not found', 'NOT_FOUND');
    }

    // Nếu sản phẩm đã bị xóa rồi
    if (product.status === ProductStatus.DELETED) {
      return res.status(200).json({ 
        message: 'Product is already deleted',
        data: { id, status: ProductStatus.DELETED }
      });
    }

    // Cập nhật trạng thái thành DELETED
    await product.update({ status: ProductStatus.DELETED });

    logger.info(`Successfully soft deleted product with ID: ${id}`);

    return res.status(200).json({
      message: 'Product deleted successfully',
      data: {
        id,
        status: ProductStatus.DELETED
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Error deleting product', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: id 
    });
    
    throw new AppError(500, 'Failed to delete product', 'INTERNAL_SERVER_ERROR');
  }
}); 