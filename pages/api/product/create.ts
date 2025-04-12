import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import { Op } from 'sequelize';
import { Product, ProductCategory, ProductItem, ProductMedia, ProductStatus, ProductItemStatus, Media } from '../../../model';
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
  items?: any[];
  media?: { 
    type: 'image' | 'video'; 
    url?: string;
    path?: string;
    mediaId?: number;
  }[];
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

  // Set timezone for timestamps
  const timestamp = moment().tz('Asia/Ho_Chi_Minh').toDate();

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

    // Add product items if provided
    if (items && items.length > 0) {
      logger.debug('Processing product items', { 
        productId: newProduct.id,
        itemCount: items.length 
      });

      const itemPromises = items.map((item: any) => {
        return ProductItem.create({
          ...item,
          status: mapStatusValue(item.status),
          productId: newProduct.id
        });
      });

      await Promise.all(itemPromises);
      logger.debug('Items added successfully', {
        productId: newProduct.id,
        itemCount: items.length
      });
    }

    // Add media if provided
    if (media && media.length > 0) {
      logger.debug('Processing product media', { 
        productId: newProduct.id,
        mediaCount: media.length 
      });

      const mediaPromises = media.map((mediaItem: any) => {
        // Chỉ sử dụng url từ payload hoặc lấy từ url của media nếu đó là đối tượng media hoàn chỉnh
        let mediaUrl;
        
        if (mediaItem.url) {
          mediaUrl = mediaItem.url;
        } else if (mediaItem.media && mediaItem.media.url) {
          mediaUrl = mediaItem.media.url;
        } else if (mediaItem.media && mediaItem.media.path) {
          // Hỗ trợ cả trường hợp dữ liệu cũ vẫn sử dụng path
          mediaUrl = mediaItem.media.path;
        }
        
        if (!mediaUrl) {
          logger.warn('Media item without url or path, skipping', { mediaItem });
          return Promise.resolve(null);
        }
        
        // Kiểm tra nếu có mediaId, đảm bảo nó tồn tại trong bảng Media
        let mediaId = mediaItem.mediaId || (mediaItem.media && mediaItem.media.id);
        
        if (mediaId) {
          return Media.findByPk(mediaId).then(existingMedia => {
            if (!existingMedia) {
              logger.warn(`Media with id ${mediaId} not found, skipping this media item`);
              return null;
            }
            
            return ProductMedia.create({
              productId: newProduct.id,
              type: mediaItem.type || (mediaItem.media && mediaItem.media.type) || 'image',
              url: mediaUrl,
              mediaId: mediaId
            });
          });
        } else {
          return ProductMedia.create({
            productId: newProduct.id,
            type: mediaItem.type || 'image',
            url: mediaUrl,
            mediaId: null
          });
        }
      });

      // Filter out null promises before awaiting
      const filteredMediaPromises = mediaPromises.filter(Boolean);
      await Promise.all(filteredMediaPromises);
      logger.debug('Media files added successfully', {
        productId: newProduct.id,
        mediaCount: media.length
      });
    }

    // Lấy sản phẩm đầy đủ với items và media
    const newProductDetails = await Product.findByPk(newProduct.id);
    
    if (newProductDetails) {
      // Lấy thêm thông tin từ các bảng liên quan
      const category = await ProductCategory.findByPk(newProductDetails.categoryId, {
        attributes: ['id', 'name', 'slug']
      });
      
      const itemsList = await ProductItem.findAll({
        where: { productId: newProduct.id }
      });
      
      // Lấy thông tin media
      const productMedia = await ProductMedia.findAll({
        where: { productId: newProduct.id },
        include: [{
          model: Media,
          as: 'mediaDetail',
          attributes: ['id', 'name', 'url', 'type', 'altText', 'createdAt', 'updatedAt']
        }]
      });
      
      // Tạo danh sách media với thông tin đầy đủ
      const mediaWithData = productMedia.map(pm => {
        const media = (pm as any).mediaDetail || {};
        return {
          id: (pm as any).id,
          productId: (pm as any).productId,
          url: (pm as any).url,
          type: (pm as any).type,
          mediaId: (pm as any).mediaId,
          createdAt: (pm as any).createdAt,
          updatedAt: (pm as any).updatedAt,
          media: {
            id: media.id,
            name: media.name,
            url: media.url || media.path,  // Sử dụng url hoặc path (nếu là dữ liệu cũ)
            type: media.type,
            altText: media.altText,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt
          }
        };
      });
      
      // Tạo dữ liệu kết hợp
      const productWithDetails = {
        ...newProductDetails.toJSON(),
        category: category ? category.toJSON() : null,
        items: itemsList.map(item => item.toJSON()),
        media: mediaWithData
      };
      
      logger.info('Product creation completed', { 
        productId: newProduct.id,
        name: newProduct.name,
        categoryId: newProduct.categoryId,
        itemCount: items?.length || 0,
        mediaCount: media?.length || 0
      });
      
      // Kiểm tra và chuyển đổi trạng thái biến thể
      for (const item of items || []) {
        // Chuyển đổi trạng thái từ "active" thành "available" nếu cần
        if (item.status === 'active') {
          item.status = ProductItemStatus.AVAILABLE;
        }
  
        // Kiểm tra trạng thái hợp lệ
        if (!Object.values(ProductItemStatus).includes(item.status)) {
          return res.status(400).json({
            message: `Trạng thái sản phẩm không hợp lệ: ${item.status}. Các trạng thái hợp lệ: ${Object.values(ProductItemStatus).join(', ')}`
          });
        }
      }
  
      res.status(201).json({ 
        success: true,
        data: productWithDetails
      });
    } else {
      throw new AppError(500, 'Failed to retrieve created product', 'INTERNAL_SERVER_ERROR');
    }

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