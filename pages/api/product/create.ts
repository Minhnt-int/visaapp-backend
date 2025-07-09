import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import { Op } from 'sequelize';
import { Product, ProductCategory, ProductItem, ProductMedia, ProductStatus, ProductItemStatus } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import moment from 'moment-timezone';
import { UniqueConstraintError, ValidationError } from 'sequelize';

// Hàm chuyển đổi giá trị status
const mapStatusValue = (status: string): string => {
  // Ánh xạ "active" thành "available"
  if (status === 'active') {
    return ProductItemStatus.AVAILABLE;
  }
  
  // Kiểm tra nếu giá trị status thuộc enum ProductItemStatus
  if (Object.values(ProductItemStatus).includes(status)) {
    return status;
  }
  
  // Mặc định trả về AVAILABLE
  return ProductItemStatus.AVAILABLE;
};

// Cập nhật type cho CreateProductBody
export type CreateProductBody = {
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId: number;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  avatarUrl?: string;
  items?: {
    name: string;
    color: string;
    price: number;
    originalPrice?: number;
    status?: string;
    mediaIds?: number[]; // Thay mediaIndex bằng mediaIds
    mediaIndex?: number[]; // Thay mediaIndex bằng mediaIds
  }[];
  media?: { 
    type: 'image' | 'video'; 
    url: string;
    altText?: string;
  }[];
};

const validateProductData = (data: any) => {
  logger.debug('Validating product data', { data });
  const errors = [];
  
  if (!data.name?.trim()) errors.push('Name is required');
  if (!data.categoryId) errors.push('Category ID is required');
  if (!data.slug?.trim()) errors.push('Slug is required');
  
  // Kiểm tra nếu có items (các biến thể sản phẩm)
  if (data.items && Array.isArray(data.items)) {
    if (data.items.length === 0) {
      errors.push('At least one product item is required');
    } else {
      // Kiểm tra từng item
      data.items.forEach((item: any, index: number) => {
        if (!item.name) errors.push(`Item ${index + 1}: Name is required`);
        if (!item.color) errors.push(`Item ${index + 1}: Color is required`);
        if (item.price === undefined || item.price < 0) errors.push(`Item ${index + 1}: Price must be a positive number`);
        
        // Kiểm tra mediaIds nếu có
        if (item.mediaIds !== undefined) {
          if (!Array.isArray(item.mediaIds)) {
            errors.push(`Item ${index + 1}: MediaIds must be an array`);
          } else {
            item.mediaIds.forEach((mediaId: any, idx: number) => {
              if (!Number.isInteger(mediaId) || mediaId <= 0) {
                errors.push(`Item ${index + 1}: MediaIds[${idx}] must be a positive integer (media ID)`);
              }
            });
          }
        }
      });
    }
  } else {
    errors.push('At least one product item is required');
  }
  
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
    name, description, shortDescription, categoryId, slug: originalSlug, 
    metaTitle, metaDescription, metaKeywords,
    items, media, avatarUrl
  } = req.body as CreateProductBody;

  // Lưu slug gốc, sẽ được sửa nếu cần
  let slug = originalSlug;

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

  try {
    logger.debug('Attempting to create product', { 
      name, categoryId, slug 
    });

    // Kiểm tra và xử lý slug đã tồn tại
    const existingProduct = await Product.findOne({ where: { slug } });
    if (existingProduct) {
      // Nếu slug đã tồn tại, thêm hậu tố ngẫu nhiên
      const randomSuffix = Math.floor(Math.random() * 10000);
      slug = `${originalSlug}-${randomSuffix}`;
      logger.debug('Slug already exists, using modified slug', { 
        originalSlug, 
        newSlug: slug 
      });
    }

    // Create product
    const newProduct = await Product.create({
      name,
      description,
      shortDescription,
      categoryId,
      slug,
      metaTitle,
      metaDescription,
      metaKeywords,
      avatarUrl,
      status: ProductStatus.DRAFT
    });

    logger.debug('Product created successfully', { 
      productId: newProduct.id,
      name: newProduct.name,
      slug: newProduct.slug
    });

    // Tạo media TRƯỚC và lưu ID
    let createdMedia: any[] = [];
    if (media && media.length > 0) {
      logger.debug('Processing product media', { 
        productId: newProduct.id,
        mediaCount: media.length 
      });

      for (let i = 0; i < media.length; i++) {
        const mediaItem = media[i];
        const createdMediaItem = await ProductMedia.create({
          productId: newProduct.id,
          type: mediaItem.type,
          url: mediaItem.url,
          altText: mediaItem.altText
        });
        createdMedia.push(createdMediaItem);
        logger.debug(`Media created at index ${i}`, { 
          mediaId: createdMediaItem.id,
          url: mediaItem.url,
          type: mediaItem.type
        });
      }

      logger.debug('Media files added successfully', {
        productId: newProduct.id,
        mediaCount: media.length,
        mediaIds: createdMedia.map(m => m.id)
      });
    }

    // Tạo items SAU KHI đã có media
    if (items && items.length > 0) {
      logger.debug('Processing product items with mediaIds (as mediaIndex)', { 
        productId: newProduct.id,
        itemCount: items.length,
        availableMediaCount: createdMedia.length,
        availableMediaIds: createdMedia.map(m => m.id)
      });

      for (const itemData of items) {
        const itemFields: any = {
          productId: newProduct.id,
          name: itemData.name,
          color: itemData.color,
          price: itemData.price,
          originalPrice: itemData.originalPrice,
          status: mapStatusValue(itemData.status || 'available'), // Mặc định là 'available'
        };

        // Xử lý mediaIndex (không xử lý mediaIds)
        if (itemData.mediaIndex !== undefined) {
          if (Array.isArray(itemData.mediaIndex) && itemData.mediaIndex.length > 0) {
            // Lấy tất cả media của product này
            const allProductMedia = await ProductMedia.findAll({
              where: { productId: newProduct.id },
              order: [['id', 'ASC']]
            });
            
            const validMediaIds = [];
            for (const mediaIndex of itemData.mediaIndex) {
              if (mediaIndex >= 0 && mediaIndex < allProductMedia.length) {
                validMediaIds.push(allProductMedia[mediaIndex].id);
              }
            }
            
            // Lưu vào database cột mediaIds
            itemFields.mediaIds = validMediaIds.length > 0 ? JSON.stringify(validMediaIds) : null;
          }
        }

        await ProductItem.create(itemFields);
      }
      
      logger.debug('Items added successfully with media links', {
        productId: newProduct.id,
        itemCount: items.length
      });
    }

    // Lấy sản phẩm đầy đủ với items và media
    const productWithDetails = await Product.findByPk(newProduct.id, {
      include: [
        {
          model: ProductItem,
          as: 'items',
          attributes: ['id', 'name', 'color', 'price', 'originalPrice', 'status', 'mediaIds'] // Thay mediaId bằng mediaIds
        },
        {
          model: ProductMedia,
          as: 'media'
        }
      ]
    });

    logger.info('Product creation completed', { 
      productId: newProduct.id,
      name: newProduct.name,
      categoryId: newProduct.categoryId,
      itemCount: items?.length || 0,
      mediaCount: media?.length || 0
    });

    res.status(201).json({ 
      success: true,
      data: productWithDetails
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