import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory, ProductItem, ProductMedia } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import { Op } from 'sequelize';

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
    const { slug, page = '1', limit = '10' } = req.query;
    
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

    // Find all subcategories
    const allSubcategories = await ProductCategory.findAll({
      where: { parentId: category.id }
    });

    // Get all category IDs (main category + all subcategories)
    const categoryIds = [category.id, ...allSubcategories.map(subcat => subcat.id)];

    logger.debug('Getting products for categories', {
      requestId,
      mainCategoryId: category.id,
      subcategoryIds: allSubcategories.map(c => c.id),
      totalCategories: categoryIds.length
    });

    // Parse pagination parameters
    const currentPage = parseInt(page as string, 10) || 1;
    const itemsPerPage = parseInt(limit as string, 10) || 10;
    const offset = (currentPage - 1) * itemsPerPage;

    // Query products with items and media
    const { count, rows: products } = await Product.findAndCountAll({
      where: {
        categoryId: {
          [Op.in]: categoryIds
        }
      },
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
          attributes: ['id', 'url'], // Chỉ lấy 2 trường
          limit: 2,
          where: {
            type: 'image'
          }
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
      subcategoryCount: allSubcategories.length,
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
          slug: category.slug,
          subcategories: allSubcategories.map(sc => ({
            id: sc.id,
            name: sc.name,
            slug: sc.slug
          }))
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