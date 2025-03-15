// filepath: /Users/duy/nextjs project/web-qua-tang/pages/api/product-category/create-category.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing category creation request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'POST') {
    logger.warn('Invalid method for category creation', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectToDatabase();
  const startTime = Date.now();

  try {
    const { name, parentId } = req.body;

    // Log input validation
    logger.debug('Validating category input', {
      requestId,
      name,
      parentId: parentId || 'root'
    });

    if (!name?.trim()) {
      logger.warn('Invalid category input', {
        requestId,
        error: 'Name is required'
      });
      throw new AppError(400, 'Name is required', 'VALIDATION_ERROR');
    }

    // Check parent category if provided
    if (parentId) {
      logger.debug('Checking parent category existence', {
        requestId,
        parentId
      });

      const parentCategory = await ProductCategory.findByPkWithLogging(parentId);
      if (!parentCategory) {
        logger.warn('Parent category not found', {
          requestId,
          parentId
        });
        throw new AppError(400, 'Parent category not found', 'PARENT_NOT_FOUND');
      }
    }

    // Check for duplicate name in the same level
    logger.debug('Checking for duplicate category name', {
      requestId,
      name,
      parentId: parentId || 'root'
    });

    const existingCategory = await ProductCategory.findOne({
      where: {
        name,
        parentId: parentId || null
      }
    });

    if (existingCategory) {
      logger.warn('Duplicate category name found', {
        requestId,
        name,
        parentId: parentId || 'root'
      });
      throw new AppError(400, 'Category with this name already exists at this level', 'DUPLICATE_NAME');
    }

    // Create new category
    logger.debug('Creating new category', {
      requestId,
      name,
      parentId: parentId || 'root'
    });

    const newCategory = ProductCategory.build({
      name,
      parentId: parentId || null,
    }, { isNewRecord: true });

    await newCategory.save();

    logger.info('Category created successfully', {
      requestId,
      categoryId: newCategory.id,
      name: newCategory.name,
      parentId: newCategory.parentId || 'root',
      processingTime: Date.now() - startTime
    });

    res.status(201).json({ 
      message: 'Category created successfully!', 
      data: {...newCategory.toJSON(), id: newCategory.id },
    });

  } catch (error) {
    logger.error('Error creating category', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
});