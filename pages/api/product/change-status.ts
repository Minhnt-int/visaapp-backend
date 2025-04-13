import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductStatus } from '../../../model';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  try {
    const { id, status } = req.body;

    // Validate input
    if (!id) {
      throw new AppError(400, 'Product ID is required', 'VALIDATION_ERROR');
    }

    if (!status) {
      throw new AppError(400, 'Status is required', 'VALIDATION_ERROR');
    }

    // Validate status value
    if (!Object.values(ProductStatus).includes(status)) {
      throw new AppError(400, `Invalid status. Valid values are: ${Object.values(ProductStatus).join(', ')}`, 'VALIDATION_ERROR');
    }

    logger.debug('Changing product status', { productId: id, newStatus: status });

    // Find the product
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError(404, 'Product not found', 'NOT_FOUND_ERROR');
    }

    // Update the status
    await product.update({ status });

    logger.info('Product status changed successfully', { 
      productId: id, 
      previousStatus: product.status,
      newStatus: status
    });

    res.status(200).json({ 
      message: 'Product status changed successfully!', 
      data: {
        id: product.id,
        name: product.name,
        status
      } 
    });
  } catch (error) {
    logger.error('Error changing product status', { error });
    throw error;
  }
}); 