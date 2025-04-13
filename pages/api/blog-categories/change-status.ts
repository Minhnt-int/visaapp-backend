import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogCategory, BlogCategoryStatus } from '../../../model';
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
      throw new AppError(400, 'Blog category ID is required', 'VALIDATION_ERROR');
    }

    if (!status) {
      throw new AppError(400, 'Status is required', 'VALIDATION_ERROR');
    }

    // Validate status value
    if (!Object.values(BlogCategoryStatus).includes(status)) {
      throw new AppError(400, `Invalid status. Valid values are: ${Object.values(BlogCategoryStatus).join(', ')}`, 'VALIDATION_ERROR');
    }

    logger.debug('Changing blog category status', { blogCategoryId: id, newStatus: status });

    // Find the blog category
    const blogCategory = await BlogCategory.findByPk(id);
    if (!blogCategory) {
      throw new AppError(404, 'Blog category not found', 'NOT_FOUND_ERROR');
    }

    // Update the status
    await blogCategory.update({ status });

    logger.info('Blog category status changed successfully', { 
      blogCategoryId: id, 
      previousStatus: blogCategory.status,
      newStatus: status
    });

    res.status(200).json({ 
      message: 'Blog category status changed successfully!', 
      data: {
        id: blogCategory.id,
        name: blogCategory.name,
        status
      } 
    });
  } catch (error) {
    logger.error('Error changing blog category status', { error });
    throw error;
  }
}); 