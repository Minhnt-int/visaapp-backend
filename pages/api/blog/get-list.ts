import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogPost, BlogCategory } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';
import { Op } from 'sequelize';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing blog list request', {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query
  });

  if (req.method !== 'GET') {
    logger.warn('Invalid method for blog listing', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectToDatabase();
  const startTime = Date.now();

  try {
    const { 
      page = '1', 
      limit = '10',
      category,
      search,
      author,
      sortBy = 'publishedAt',
      sortOrder = 'DESC'
    } = req.query;

    // Log query parameters
    logger.debug('Processing blog list parameters', {
      requestId,
      page,
      limit,
      category,
      search,
      author,
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
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    const offset = (pageNumber - 1) * limitNumber;

    // Build query conditions
    const where: any = {};
    const include: any[] = [{
      model: BlogCategory,
      as: 'category'
    }];

    if (search) {
      where.title = {
        [Op.like]: `%${search}%`
      };
      logger.debug('Added search condition', {
        requestId,
        searchTerm: search
      });
    }

    if (category) {
      where.blogCategoryId = category;
      logger.debug('Added category filter', {
        requestId,
        categoryId: category
      });
    }

    if (author) {
      where.author = author;
      logger.debug('Added author filter', {
        requestId,
        author
      });
    }

    // Execute query
    const { count, rows } = await BlogPost.findAndCountAll({
      where,
      include,
      offset,
      limit: limitNumber,
      order: [[sortBy as string, sortOrder as string]]
    });

    const totalPages = Math.ceil(count / limitNumber);

    logger.info('Blog list retrieved successfully', {
      requestId,
      totalPosts: count,
      returnedPosts: rows.length,
      page: pageNumber,
      totalPages,
      processingTime: Date.now() - startTime
    });

    res.status(200).json({
      message: 'Blogs fetched successfully!',
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
    logger.error('Error fetching blog list', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
});