import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogPost, BlogStatus } from '../../../model';
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
      throw new AppError(400, 'Blog post ID is required', 'VALIDATION_ERROR');
    }

    if (!status) {
      throw new AppError(400, 'Status is required', 'VALIDATION_ERROR');
    }

    // Validate status value
    if (!Object.values(BlogStatus).includes(status)) {
      throw new AppError(400, `Invalid status. Valid values are: ${Object.values(BlogStatus).join(', ')}`, 'VALIDATION_ERROR');
    }

    logger.debug('Changing blog post status', { blogPostId: id, newStatus: status });

    // Find the blog post
    const blogPost = await BlogPost.findByPk(id);
    if (!blogPost) {
      throw new AppError(404, 'Blog post not found', 'NOT_FOUND_ERROR');
    }

    // Update the status
    await blogPost.update({ status });

    logger.info('Blog post status changed successfully', { 
      blogPostId: id, 
      previousStatus: blogPost.status,
      newStatus: status
    });

    res.status(200).json({ 
      message: 'Blog post status changed successfully!', 
      data: {
        id: blogPost.id,
        title: blogPost.title,
        status
      } 
    });
  } catch (error) {
    logger.error('Error changing blog post status', { error });
    throw error;
  }
}); 