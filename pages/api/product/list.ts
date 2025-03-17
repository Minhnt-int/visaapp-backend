import { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import Product from '../../../model/Product';
import ProductCategory from '../../../model/ProductCategory';
import ProductMedia from '../../../model/ProductMedia';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing product list request', {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query
  });

  if (req.method !== 'GET') {
    logger.warn('Invalid method for product listing', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    page = '1',
    limit = '10',
    category,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  // Log query parameters
  logger.debug('Processing product list parameters', {
    requestId,
    page,
    limit,
    category,
    search,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder
  });

  // Validate and parse pagination
  const pageNumber = parseInt(page as string, 10);
  const itemsPerPage = parseInt(limit as string, 10);

  if (isNaN(pageNumber) || isNaN(itemsPerPage) || pageNumber < 1 || itemsPerPage < 1) {
    logger.warn('Invalid pagination parameters', {
      requestId,
      page,
      limit
    });
    return res.status(400).json({ message: 'Invalid pagination parameters' });
  }

  // Build query conditions
  const where: any = {};

  if (search) {
    where.name = {
      [Op.like]: `%${search}%`
    };
    logger.debug('Added search condition', {
      requestId,
      searchTerm: search
    });
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice as string);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice as string);
    logger.debug('Added price range condition', {
      requestId,
      minPrice,
      maxPrice
    });
  }

  if (category) {
    where.categoryId = category;
    logger.debug('Added category filter', {
      requestId,
      categoryId: category
    });
  }

  // Start timing the query
  const startTime = Date.now();

  try {
    // Execute query
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: ProductCategory,
          as: 'category'
        },
        {
          model: ProductMedia,
          as: 'media',
          limit: 2,
          where: {
            type: 'image' // Thêm điều kiện type là image
          }
        }
      ],
      attributes: [
        'id',
        'name',
        'description',
        'price',
        'quantity'
      ],
      order: [[sortBy as string, sortOrder as string]],
      limit: itemsPerPage,
      offset: (pageNumber - 1) * itemsPerPage
    });

    const totalPages = Math.ceil(count / itemsPerPage);

    logger.info('Product list retrieved successfully', {
      requestId,
      totalProducts: count,
      returnedProducts: products.length,
      page: pageNumber,
      totalPages,
      processingTime: Date.now() - startTime
    });

    return res.status(200).json({
      products,
      pagination: {
        total: count,
        page: pageNumber,
        totalPages,
        hasMore: pageNumber < totalPages
      }
    });

  } catch (error) {
    logger.error('Error retrieving product list', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    });
    throw error;
  }
});