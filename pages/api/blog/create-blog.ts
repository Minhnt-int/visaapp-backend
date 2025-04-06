import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogPost, BlogCategory } from '../../../model';
import moment from 'moment-timezone';
import formidable from 'formidable';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing blog creation request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'POST') {
    logger.warn('Invalid method for blog creation', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectToDatabase();
  const startTime = Date.now();

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      logger.error('Error parsing form data', {
        requestId,
        error: err.message,
        stack: err.stack
      });
      return res.status(500).json({ message: 'Error parsing form data' });
    }

    const { 
      title, content, slug, metaTitle, metaDescription, 
      metaKeywords, author, publishedAt, blogCategoryId, avatarId
    } = fields;

    // Log input validation
    logger.debug('Validating blog post input', {
      requestId,
      title: Array.isArray(title) ? title[0] : title,
      slug: Array.isArray(slug) ? slug[0] : slug,
      blogCategoryId: Array.isArray(blogCategoryId) ? blogCategoryId[0] : blogCategoryId,
      hasContent: !!content
    });

    // Check category existence
    logger.debug('Checking blog category existence', {
      requestId,
      categoryId: Array.isArray(blogCategoryId) ? blogCategoryId[0] : blogCategoryId
    });

    const category = await BlogCategory.findByPk(Array.isArray(blogCategoryId) ? blogCategoryId[0] : blogCategoryId);
    if (!category) {
      logger.warn('Blog category not found', {
        requestId,
        categoryId: Array.isArray(blogCategoryId) ? blogCategoryId[0] : blogCategoryId
      });
      return res.status(400).json({ message: 'Blog category not found' });
    }

    // Check slug uniqueness
    logger.debug('Checking slug uniqueness', {
      requestId,
      slug: Array.isArray(slug) ? slug[0] : slug
    });

    const existingPost = await BlogPost.findOne({ where: { slug } });
    if (existingPost) {
      logger.warn('Duplicate slug found', {
        requestId,
        slug: Array.isArray(slug) ? slug[0] : slug
      });
      return res.status(400).json({ message: 'Slug đã tồn tại' });
    }

    const contentStr = typeof content === 'string' ? content : '';

    try {
      // Create blog post without processing images in content
      logger.debug('Creating new blog post', {
        requestId,
        title: Array.isArray(title) ? title[0] : title,
        slug: Array.isArray(slug) ? slug[0] : slug
      });

      const newBlogPost = await BlogPost.create({
        title: Array.isArray(title) ? title[0] : title || '',
        content: contentStr, // Use content directly without modification
        slug: Array.isArray(slug) ? slug[0] : slug || '',
        metaTitle: Array.isArray(metaTitle) ? metaTitle[0] : metaTitle || '',
        metaDescription: Array.isArray(metaDescription) ? metaDescription[0] : metaDescription || '',
        metaKeywords: Array.isArray(metaKeywords) ? metaKeywords[0] : (metaKeywords || ''),
        author: Array.isArray(author) ? author[0] : (author || ''),
        blogCategoryId: Array.isArray(blogCategoryId) ? parseInt(blogCategoryId[0], 10) : (blogCategoryId ? parseInt(blogCategoryId, 10) : 0),
        avatarId: Array.isArray(avatarId) && avatarId[0] ? Number(avatarId[0]) : 
          (typeof avatarId === 'string' && avatarId ? Number(avatarId) : undefined),
        publishedAt: publishedAt ? moment(publishedAt).tz('Asia/Ho_Chi_Minh').toDate() : moment().tz('Asia/Ho_Chi_Minh').toDate(),
        createdAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
        updatedAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
      });

      logger.info('Blog post created successfully', {
        requestId,
        blogId: newBlogPost.id,
        title: newBlogPost.title,
        categoryId: newBlogPost.blogCategoryId,
        processingTime: Date.now() - startTime
      });

      res.status(201).json({ 
        message: 'Blog post created successfully!', 
        data: {...newBlogPost.toJSON(), id: newBlogPost.id} 
      });

    } catch (error) {
      logger.error('Error creating blog post', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processingTime: Date.now() - startTime
      });
      throw error;
    }
  });
});