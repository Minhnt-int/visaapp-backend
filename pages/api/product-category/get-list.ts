import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { ProductCategory, ProductCategoryStatus } from '../../../model';
import { Op } from 'sequelize';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing category list request', {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query
  });

  if (req.method !== 'GET') {
    logger.warn('Invalid method for category listing', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectToDatabase();
  const startTime = Date.now();

  try {
    const { page = '1', limit = '10', name, parentId, sortBy = 'createdAt', sortOrder = 'DESC', status } = req.query;

    // Log query parameters
    logger.debug('Processing category list parameters', {
      requestId,
      page,
      limit,
      name,
      parentId,
      status,
      sortBy,
      sortOrder
    });

    // Validate pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
      logger.warn('Invalid pagination parameters', {
        requestId,
        page,
        limit
      });
      throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
    }

    const offset = (pageNumber - 1) * limitNumber;

    // Build search conditions
    const where: any = {};
    
    if (name) {
      where.name = {
        [Op.like]: `%${name}%`
      };
      logger.debug('Added name search condition', {
        requestId,
        searchTerm: name
      });
    }

    if (parentId) {
      where.parentId = parentId;
      logger.debug('Added parent filter', {
        requestId,
        parentId
      });
    }

    // Thêm điều kiện lọc theo status
    if (status) {
      // Kiểm tra status hợp lệ
      const validStatusValues = Object.values(ProductCategoryStatus);
      if (validStatusValues.includes(status as string)) {
        where.status = status;
        logger.debug('Added status filter', {
          requestId,
          status
        });
      } else {
        logger.warn('Invalid status value, ignoring filter', {
          requestId,
          status
        });
      }
    } else {
      // Mặc định chỉ lấy các danh mục active nếu không chỉ định status
      where.status = ProductCategoryStatus.ACTIVE;
      logger.debug('Using default status filter (active)', {
        requestId
      });
    }

    // Execute query with logging
    logger.debug('Executing category search', {
      requestId,
      where,
      offset,
      limit: limitNumber,
      sortBy,
      sortOrder
    });

    const { count, rows } = await ProductCategory.findAndCountAll({
      where,
      offset,
      limit: limitNumber,
      order: [[sortBy as string, sortOrder as string]]
    });

    const totalPages = Math.ceil(count / limitNumber);

    logger.info('Categories retrieved successfully', {
      requestId,
      totalCategories: count,
      returnedCategories: rows.length,
      page: pageNumber,
      totalPages,
      processingTime: Date.now() - startTime
    });

    res.status(200).json({
      message: 'Categories fetched successfully!',
      data: rows,
      pagination: {
        total: count,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
        hasMore: pageNumber < totalPages
      }
    });

  } catch (error) {
    logger.error('Error fetching categories', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
});