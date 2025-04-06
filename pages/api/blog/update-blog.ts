import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogPost, BlogCategory } from '../../../model';
import moment from 'moment-timezone';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import sequelize from '../../../lib/db';
import { QueryTypes } from 'sequelize';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing blog update request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'PUT') {
    logger.warn('Invalid method for blog update', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectToDatabase();
  const startTime = Date.now();
  const transaction = await sequelize.transaction();

  try {
    const { 
      id, title, content, slug, metaTitle, metaDescription, 
      metaKeywords, author, publishedAt, blogCategoryId, avatarId
    } = req.body;

    // Log input validation
    logger.debug('Validating blog update input', {
      requestId,
      blogId: id,
      hasTitle: !!title,
      hasContent: !!content,
      hasSlug: !!slug,
      categoryId: blogCategoryId
    });

    if (!id) {
      logger.warn('Missing blog ID for update', { requestId });
      await transaction.rollback();
      throw new AppError(400, 'Blog ID is required', 'VALIDATION_ERROR');
    }

    // Find blog post
    logger.debug('Finding blog post for update', {
      requestId,
      blogId: id
    });

    const blogPost = await BlogPost.findByPk(id, { transaction });
    if (!blogPost) {
      logger.warn('Blog post not found', {
        requestId,
        blogId: id
      });
      await transaction.rollback();
      throw new AppError(404, 'Blog post not found', 'NOT_FOUND_ERROR');
    }

    // Check category if provided
    if (blogCategoryId) {
      logger.debug('Checking blog category existence', {
        requestId,
        categoryId: blogCategoryId
      });

      const category = await BlogCategory.findByPk(blogCategoryId, { transaction });
      if (!category) {
        logger.warn('Blog category not found', {
          requestId,
          categoryId: blogCategoryId
        });
        await transaction.rollback();
        throw new AppError(400, 'Blog category not found', 'CATEGORY_NOT_FOUND');
      }
    }

    // Check slug uniqueness if changed
    if (slug && slug !== blogPost.slug) {
      logger.debug('Checking slug uniqueness', {
        requestId,
        oldSlug: blogPost.slug,
        newSlug: slug
      });

      const existingPost = await BlogPost.findOne({ 
        where: { slug },
        transaction
      });
      
      if (existingPost && existingPost.id !== blogPost.id) {
        logger.warn('Duplicate slug found', {
          requestId,
          slug
        });
        await transaction.rollback();
        throw new AppError(400, 'Slug already exists', 'DUPLICATE_SLUG');
      }
    }

    // Build update object
    const updateFields: any = {};
    if (title) updateFields.title = title;
    if (content) updateFields.content = content;
    if (slug) updateFields.slug = slug;
    if (metaTitle !== undefined) updateFields.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateFields.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateFields.metaKeywords = metaKeywords;
    if (author) updateFields.author = author;
    if (publishedAt !== undefined) updateFields.publishedAt = publishedAt ? 
      moment(publishedAt).tz('Asia/Ho_Chi_Minh').toDate() : null;
    if (blogCategoryId) updateFields.blogCategoryId = blogCategoryId;
    if (avatarId !== undefined) updateFields.avatarId = avatarId;

    // Track changes for logging
    const changes: Record<string, { old: any; new: any }> = {};

    for (const field in updateFields) {
      changes[field] = { old: blogPost[field as keyof BlogPost], new: updateFields[field] };
    }

    // Thêm updated_at cho câu query
    updateFields.updatedAt = new Date();
    
    // Nếu không có trường nào được cập nhật, không cần thực hiện query
    if (Object.keys(updateFields).length === 1) { // Chỉ có updatedAt
      logger.warn('No fields to update provided', { blogId: id });
      await transaction.rollback();
      throw new AppError(400, 'No update fields provided', 'VALIDATION_ERROR');
    }
    
    // Thực hiện câu lệnh SQL trực tiếp
    const updateQuery = `UPDATE blog_posts SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')} WHERE id = ?`;
    
    logger.debug('Executing direct SQL update', { 
      query: updateQuery, 
      params: [...Object.values(updateFields), id],
      changes
    });
    
    await sequelize.query(updateQuery, {
      replacements: [...Object.values(updateFields), id],
      type: QueryTypes.UPDATE,
      transaction
    });

    // Commit the transaction
    await transaction.commit();
    
    // Fetch the updated blog post to ensure we have the latest data
    const updatedBlogPost = await BlogPost.findByPk(id);

    logger.info('Blog post updated successfully', {
      requestId,
      blogId: id,
      title: updatedBlogPost?.title,
      categoryId: updatedBlogPost?.blogCategoryId,
      changedFields: Object.keys(changes),
      processingTime: Date.now() - startTime
    });

    res.status(200).json({ 
      message: 'Blog post updated successfully!', 
      data: updatedBlogPost
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    logger.error('Error updating blog post', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
});