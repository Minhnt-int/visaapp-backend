import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { ProductCategory, ProductCategoryStatus } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  try {
    const { status, includeAll } = req.query;
    
    logger.debug('Getting all categories', { status, includeAll });
    
    const where: any = {};
    
    // Nếu includeAll=true thì không lọc theo status, lấy tất cả các danh mục
    if (includeAll !== 'true') {
      if (status) {
        // Kiểm tra status hợp lệ
        const validStatusValues = Object.values(ProductCategoryStatus);
        if (validStatusValues.includes(status as string)) {
          where.status = status;
          logger.debug('Filtering by status', { status });
        } else {
          logger.warn('Invalid status value, using default (active)', { status });
          where.status = ProductCategoryStatus.ACTIVE;
        }
      } else {
        // Mặc định chỉ lấy các danh mục active
        where.status = ProductCategoryStatus.ACTIVE;
        logger.debug('Using default status filter (active)');
      }
    } else {
      logger.debug('Including all categories regardless of status');
    }

    // Lấy tất cả danh mục sản phẩm
    const categories = await ProductCategory.findAll({
      where,
      order: [
        ['name', 'ASC'],
        ['createdAt', 'DESC']
      ],
    });

    logger.info('Categories retrieved successfully', { count: categories.length });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching all categories', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

export default handler; 