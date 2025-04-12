import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory, Media, ProductMedia, ProductItem, OrderItem } from '../../../model';
import moment from 'moment-timezone';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  try {
    const { 
      id, name, description, shortDescription, categoryId, slug, 
      metaTitle, metaDescription, metaKeywords,
      avatarUrl, media, items
    } = req.body;

    logger.debug('Updating product', { id, name, categoryId, avatarUrl });

    if (!id) {
      throw new AppError(400, 'Product ID is required', 'INVALID_REQUEST');
    }

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(id);
    logger.debug('Checking product existence', { id, product: product ? product.toJSON() : null });
    
    if (!product) {
      logger.error('Product not found', { id });
      throw new AppError(404, `Product with id ${id} not found`, 'NOT_FOUND_ERROR');
    }

    // Kiểm tra xem danh mục có tồn tại không
    if (categoryId) {
      const category = await ProductCategory.findByPk(categoryId);
      if (!category) {
        throw new AppError(400, 'Category not found', 'CATEGORY_NOT_FOUND');
      }
    }

    // Build update object
    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (shortDescription !== undefined) updateFields.shortDescription = shortDescription;
    if (categoryId) updateFields.categoryId = categoryId;
    if (slug) updateFields.slug = slug;
    if (metaTitle !== undefined) updateFields.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateFields.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateFields.metaKeywords = metaKeywords;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

    // Cập nhật sản phẩm
    await product.update(updateFields);

    // Cập nhật media nếu có
    if (media && Array.isArray(media)) {
      // Xóa các media cũ
      await ProductMedia.destroy({
        where: { productId: id }
      });

      // Tạo media mới
      for (const mediaItem of media) {
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
          continue;
        }
        
        // Kiểm tra nếu có mediaId, đảm bảo nó tồn tại trong bảng Media
        let mediaId = mediaItem.mediaId || (mediaItem.media && mediaItem.media.id);
        
        if (mediaId) {
          const existingMedia = await Media.findByPk(mediaId);
          if (!existingMedia) {
            logger.warn(`Media with id ${mediaId} not found, skipping this media item`);
            continue;
          }
        }
        
        // Tạo bản ghi media mới
        await ProductMedia.create({
          productId: id,
          url: mediaUrl,
          type: mediaItem.type || (mediaItem.media && mediaItem.media.type) || 'image',
          mediaId: mediaId || null  // Đảm bảo mediaId là null nếu không được cung cấp
        });
      }
    }

    // Cập nhật items nếu có
    if (items && Array.isArray(items)) {
      // Lấy danh sách items hiện tại
      const existingItems = await ProductItem.findAll({
        where: { productId: id }
      });

      // Tạo map để theo dõi items cần cập nhật
      const existingItemsMap = new Map(existingItems.map(item => [(item as any).id, item]));
      const newItemsMap = new Map(items.map(item => [item.id, item]));

      // Xử lý từng item
      for (const item of items) {
        const { id: itemId, name, color, price, originalPrice, status } = item;
        
        if (itemId && existingItemsMap.has(itemId)) {
          // Cập nhật item hiện có
          await ProductItem.update(
            { name, color, price, originalPrice, status },
            { where: { id: itemId } }
          );
          existingItemsMap.delete(itemId);
        } else {
          // Tạo item mới
          await ProductItem.create({
            productId: id,
            name,
            color,
            price,
            originalPrice,
            status
          });
        }
      }

      // Xóa các items không còn tồn tại trong request
      // Chỉ xóa những items chưa có order_items
      const itemsToDelete = Array.from(existingItemsMap.keys());
      if (itemsToDelete.length > 0) {
        // Kiểm tra items nào chưa có order_items
        const itemsWithoutOrders = await ProductItem.findAll({
          where: {
            id: itemsToDelete
          },
          include: [{
            model: OrderItem,
            as: 'orderItems',
            required: false
          }]
        });

        // Lọc ra các items có thể xóa (chưa có order_items)
        const deletableItems = itemsWithoutOrders
          .filter(item => !(item as any).orderItems?.length)
          .map(item => (item as any).id);

        if (deletableItems.length > 0) {
          await ProductItem.destroy({
            where: {
              id: deletableItems
            }
          });
        }
      }
    }

    // Trả về sản phẩm với dữ liệu đã cập nhật
    const updatedProduct = await Product.findByPk(id);
    
    if (updatedProduct) {
      // Lấy thêm thông tin từ các bảng liên quan
      const category = await ProductCategory.findByPk((updatedProduct as any).categoryId, {
        attributes: ['id', 'name', 'slug']
      });
      
      const items = await ProductItem.findAll({
        where: { productId: id }
      });
      
      // Lấy thông tin media
      const productMedia = await ProductMedia.findAll({
        where: { productId: id },
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
      
      // Trả về dữ liệu kết hợp
      logger.info('Product updated successfully', { 
        id: (updatedProduct as any).id,
        name: (updatedProduct as any).name, 
        avatarUrl: updateFields.avatarUrl
      });
      
      res.status(200).json({
        message: 'Product updated successfully!', 
        data: {
          ...updatedProduct.toJSON(),
          category: category ? category.toJSON() : null,
          items: items.map(item => item.toJSON()),
          media: mediaWithData
        }
      });
    } else {
      throw new AppError(404, `Product with id ${id} not found after update`, 'NOT_FOUND_ERROR');
    }
  } catch (error: any) {
    const errorDetails = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      ...(error instanceof AppError ? { code: error.code } : {}),
      requestBody: req.body,
      productId: req.body.id
    };

    logger.error('Error updating product', errorDetails);
    
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(500, errorDetails.message, 'INTERNAL_SERVER_ERROR');
    }
  }
});