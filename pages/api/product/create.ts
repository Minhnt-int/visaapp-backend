import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';
import Product from '../../../model/Product';
import ProductMedia from '../../../model/ProductMedia';
import moment from 'moment-timezone';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

const validateProductData = (data: any) => {
  logger.debug('Validating product data', { data });
  const errors = [];
  
  if (!data.name?.trim()) errors.push('Name is required');
  if (!data.price || data.price < 0) errors.push('Price must be a positive number');
  if (!data.categoryId) errors.push('Category ID is required');
  if (!data.slug?.trim()) errors.push('Slug is required');
  
  if (errors.length > 0) {
    logger.warn('Product validation failed', { errors });
    throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors);
  }
  
  logger.debug('Product validation successful');
};

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    logger.warn('Invalid method attempt', { method: req.method, path: req.url });
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();
  logger.info('Creating new product', { 
    body: req.body,
    clientIp: req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  const { 
    name, price, description, categoryId, slug, 
    metaTitle, metaDescription, metaKeywords, media 
  } = req.body;

  // Validate input data
  validateProductData(req.body);

  // Check if category exists
  logger.debug('Checking category existence', { categoryId });
  const category = await ProductCategory.findByPk(categoryId);
  if (!category) {
    logger.warn('Category not found', { categoryId });
    throw new AppError(400, 'Category not found', 'CATEGORY_NOT_FOUND');
  }
  logger.debug('Category found', { categoryId, categoryName: category.name });

  // Set timezone for timestamps
  const timestamp = moment().tz('Asia/Ho_Chi_Minh').toDate();

  try {
    logger.debug('Attempting to create product', { 
      name, price, categoryId, slug 
    });

    // Create product
    const newProduct = await Product.create({
      name,
      price,
      description,
      categoryId,
      slug,
      metaTitle,
      metaDescription,
      metaKeywords,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    logger.debug('Product created successfully', { 
      productId: newProduct.id,
      name: newProduct.name
    });

    // Add media if provided
    if (media?.length > 0) {
      logger.debug('Processing product media', { 
        productId: newProduct.id,
        mediaCount: media.length 
      });

      const mediaPromises = media.map((mediaItem: { type: 'image' | 'video'; url: string }) => {
        return ProductMedia.create({
          productId: newProduct.id,
          type: mediaItem.type,
          url: mediaItem.url,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });

      await Promise.all(mediaPromises);
      logger.debug('Media files added successfully', {
        productId: newProduct.id,
        mediaCount: media.length
      });
    }

    logger.info('Product creation completed', { 
      productId: newProduct.id,
      name: newProduct.name,
      categoryId: newProduct.categoryId,
      mediaCount: media?.length || 0
    });

    res.status(201).json({ 
      success: true,
      data: { ...newProduct.toJSON(), id: newProduct.id }
    });

  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const uniqueErrors = error.errors.map(err => ({
        field: err.path,
        message: `${err.path} already exists`
      }));
      logger.warn('Unique constraint violation', { errors: uniqueErrors });
      throw new AppError(400, 'Validation error', 'UNIQUE_CONSTRAINT_ERROR', uniqueErrors);
    }
    
    if (error instanceof ValidationError) {
      logger.warn('Validation error', { errors: error.errors });
      throw new AppError(400, 'Validation error', 'VALIDATION_ERROR', error.errors);
    }

    logger.error('Unexpected error during product creation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body
    });
    throw error;
  }
});

export default handler;