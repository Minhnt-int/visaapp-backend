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

  logger.info(`Attempting to restore product with ID: ${id}`);

  try {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new AppError(404, 'Product not found', 'NOT_FOUND');
    }

    // Nếu sản phẩm không ở trạng thái DELETED
    if ((product as any).status !== ProductStatus.DELETED) {
      return res.status(400).json({ 
        message: 'Product is not in deleted state',
        data: { id, status: (product as any).status }
      });
    }

    // Cập nhật trạng thái thành DRAFT
    await product.update({ status: ProductStatus.DRAFT });

    logger.info(`Successfully restored product with ID: ${id}`);

    return res.status(200).json({
      message: 'Product restored successfully',
      data: {
        id,
        status: ProductStatus.DRAFT
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Error restoring product', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: id 
    });
    
    throw new AppError(500, 'Failed to restore product', 'INTERNAL_SERVER_ERROR');
  }
}); 