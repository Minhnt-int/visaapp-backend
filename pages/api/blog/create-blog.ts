import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import BlogPost from '../../../model/BlogPost';
import BlogCategory from '../../../model/BlogCategory';
import moment from 'moment-timezone';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
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
      metaKeywords, author, publishedAt, blogCategoryId 
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

    // Process images in content
    logger.debug('Processing content images', { requestId });
    const imageUrls = contentStr.match(/src="([^"]+)"/g) || [];
    logger.debug('Found images in content', {
      requestId,
      imageCount: imageUrls.length
    });

    let updatedContent = contentStr;
    let processedImages = 0;

    try {
      for (const imageUrl of imageUrls) {
        const localPathMatch = imageUrl.match(/src="([^"]+)"/);
        if (localPathMatch) {
          const localPath = localPathMatch[1];
          const fileName = path.basename(localPath);
          const filePath = path.join(process.cwd(), localPath);

          if (fs.existsSync(filePath)) {
            logger.debug('Processing image', {
              requestId,
              fileName,
              localPath
            });

            const fileData = fs.readFileSync(filePath);
            const formData = new FormData();
            formData.append('file', new Blob([fileData], { type: 'application/octet-stream' }), fileName);

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            const uploadResult = await uploadResponse.json();
            const newImageUrl = `/uploads/${uploadResult.fileName}`;
            updatedContent = updatedContent.replace(localPath, newImageUrl);
            processedImages++;

            logger.debug('Image processed successfully', {
              requestId,
              fileName,
              newUrl: newImageUrl
            });
          }
        }
      }

      logger.info('Content images processed', {
        requestId,
        totalImages: imageUrls.length,
        processedImages
      });

      // Create blog post
      logger.debug('Creating new blog post', {
        requestId,
        title: Array.isArray(title) ? title[0] : title,
        slug: Array.isArray(slug) ? slug[0] : slug
      });

      const newBlogPost = await BlogPost.create({
        title: Array.isArray(title) ? title[0] : title || '',
        content: updatedContent,
        slug: Array.isArray(slug) ? slug[0] : slug || '',
        metaTitle: Array.isArray(metaTitle) ? metaTitle[0] : metaTitle || '',
        metaDescription: Array.isArray(metaDescription) ? metaDescription[0] : metaDescription || '',
        metaKeywords: Array.isArray(metaKeywords) ? metaKeywords[0] : (metaKeywords || ''),
        author: Array.isArray(author) ? author[0] : (author || ''),
        blogCategoryId: Array.isArray(blogCategoryId) ? parseInt(blogCategoryId[0], 10) : (blogCategoryId ? parseInt(blogCategoryId, 10) : 0),
        publishedAt: publishedAt ? moment(publishedAt).tz('Asia/Ho_Chi_Minh').toDate() : moment().tz('Asia/Ho_Chi_Minh').toDate(),
        createdAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
        updatedAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
      });

      logger.info('Blog post created successfully', {
        requestId,
        blogId: newBlogPost.id,
        title: newBlogPost.title,
        categoryId: newBlogPost.blogCategoryId,
        processedImages,
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