import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { Product, ProductCategory, ProductItem, ProductMedia } from '../../../../model';
import logger from '../../../../lib/logger';
import { asyncHandler, AppError } from '../../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing product list by category slug request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'GET') {
    logger.warn('Invalid method for product list by category', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectToDatabase();
  const startTime = Date.now();

  try {
    const { slug } = req.query;
    const { page = '1', limit = '10' } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      logger.warn('Missing category slug parameter', { requestId });
      throw new AppError(400, 'Category slug is required', 'VALIDATION_ERROR');
    }

    // Find category by slug
    const category = await ProductCategory.findOne({
      where: { slug }
    });

    if (!category) {
      logger.warn('Category not found by slug', { requestId, slug });
      throw new AppError(404, 'Category not found', 'NOT_FOUND_ERROR');
    }

    // Parse pagination parameters
    const currentPage = parseInt(page as string, 10) || 1;
    const itemsPerPage = parseInt(limit as string, 10) || 10;
    const offset = (currentPage - 1) * itemsPerPage;

    // Query products with items and media
    const { count, rows: products } = await Product.findAndCountAll({
      where: { categoryId: category.id },
      include: [
        {
          model: ProductItem,
          as: 'items',
          required: false,
        },
        {
          model: ProductMedia,
          as: 'media',
          required: false,
        },
        {
          model: ProductCategory,
          as: 'category',
          required: false,
          attributes: ['id', 'name', 'slug']
        }
      ],
      offset,
      limit: itemsPerPage,
      order: [
        ['createdAt', 'DESC']
      ],
      distinct: true
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / itemsPerPage);

    logger.info('Products retrieved by category slug successfully', {
      requestId,
      categoryId: category.id,
      categorySlug: category.slug,
      productsCount: count,
      page: currentPage,
      totalPages,
      processingTime: Date.now() - startTime
    });

    // Return response with pagination metadata
    res.status(200).json({
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          total: count,
          totalPages,
          currentPage,
          itemsPerPage
        },
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving products by category slug', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
}); 