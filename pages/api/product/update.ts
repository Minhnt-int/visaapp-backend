import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory, ProductMedia, ProductItem, ProductItemStatus } from '../../../model'; // Added ProductItem and ProductItemStatus
import moment from 'moment-timezone';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

const mapItemStatusValue = (status: string): string => {
  // Kiểm tra giá trị tương đương
  if (status === 'active' || status === 'available') {
    return 'available';
  } else if (status === 'discontinued') {
    return 'discontinued';
  } else if (status === 'out_of_stock') {
    return 'out_of_stock';
  }
  
  // Trả về giá trị mặc định an toàn
  logger.warn(`Invalid status value: ${status}, using default 'available'`);
  return 'available';
};

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  try {
    const { 
      id, name, description, shortDescription, categoryId, slug, 
      metaTitle, metaDescription, metaKeywords, status, // Added status
      avatarUrl, media, items // Added items
    } = req.body;

    logger.debug('Updating product', { id, name, categoryId, avatarUrl });

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(id) as any;
    if (!product) {
      throw new AppError(404, 'Product not found', 'NOT_FOUND_ERROR');
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
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (shortDescription !== undefined) updateFields.shortDescription = shortDescription;
    if (categoryId !== undefined) updateFields.categoryId = categoryId;
    if (slug !== undefined) updateFields.slug = slug;
    if (metaTitle !== undefined) updateFields.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateFields.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateFields.metaKeywords = metaKeywords;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
    if (status !== undefined) {
      // TODO: Consider validating status against ProductStatus enum if necessary
      updateFields.status = status;
    }

    let productDirectlyChanged = Object.keys(updateFields).length > 0;
    let associatedDataChanged = false;

    // Cập nhật sản phẩm
    if (productDirectlyChanged) {
      await product.update(updateFields);
    }

    // Cập nhật media nếu có
    if (media && Array.isArray(media)) {
      logger.debug('Updating product media', { 
        productId: id,
        mediaCount: media.length 
      });
      // Optional: Logic to remove media not present in the request
      // const existingMediaIds = (await ProductMedia.findAll({ where: { productId: id }, attributes: ['id'] })).map(m => m.id);
      // const receivedMediaIds = media.filter(m => m.id).map(m => m.id);
      // const mediaToDelete = existingMediaIds.filter(existingId => !receivedMediaIds.includes(existingId));
      // if (mediaToDelete.length > 0) {
      //   await ProductMedia.destroy({ where: { id: mediaToDelete, productId: id } });
      //   associatedDataChanged = true;
      //   logger.debug('Deleted product media', { count: mediaToDelete.length, productId: id });
      // }

      // Xử lý từng media
      for (const mediaItem of media) {
        if (mediaItem.id) {
          // Cập nhật media hiện có
          const existingMedia = await ProductMedia.findOne({
            where: { id: mediaItem.id, productId: id }
          }) as any;
          if (existingMedia) {
            await existingMedia.update({
              type: mediaItem.type || existingMedia.type,
              url: mediaItem.url || existingMedia.url,
              altText: mediaItem.altText
            });
            associatedDataChanged = true;
            logger.debug('Updated existing media', { 
              mediaId: existingMedia.id,
              productId: id
            });
          }
        } else {
          // Thêm media mới - ensure required fields
          if (mediaItem.url && mediaItem.type) {
            await ProductMedia.create({
              productId: id,
              type: mediaItem.type,
              url: mediaItem.url,
              altText: mediaItem.altText
            });
            associatedDataChanged = true;
            logger.debug('Added new media', { productId: id });
          } else {
            logger.warn('Skipped creating new media due to missing URL or type', { productId: id, mediaItem });
          }
        }
      }
    }

    // Cập nhật items nếu có
    // TODO: Consider reusing/adapting mapStatusValue from product/create.ts for item statuses
    if (items && Array.isArray(items)) {
      logger.debug('Updating product items', { productId: id, itemCount: items.length });
      const existingDbItems = await ProductItem.findAll({ where: { productId: id } }) as any[];
      const existingDbItemIds = existingDbItems.map(item => item.id);
      const receivedItemIds = items.filter(item => item.id).map(item => item.id);
      console.log('Received item IDs:', receivedItemIds);
      console.log('Existing DB item IDs:', existingDbItemIds);
      

      // Update or Create items
      for (const itemData of items) {
        const itemUpdateFields: any = {};
        if (itemData.name !== undefined) itemUpdateFields.name = itemData.name;
        if (itemData.color !== undefined) itemUpdateFields.color = itemData.color;
        if (itemData.price !== undefined) itemUpdateFields.price = itemData.price;
        if (itemData.originalPrice !== undefined) itemUpdateFields.originalPrice = itemData.originalPrice;
        if (itemData.status !== undefined) {
            itemUpdateFields.status = mapItemStatusValue(itemData.status);
        }
        // Add other updatable fields for ProductItem as needed

        // Đảm bảo ID được xử lý như số
        if (itemData.id) { // Existing item
          // Chuyển đổi id thành number để đảm bảo so sánh đúng kiểu
          const itemId = typeof itemData.id === 'string' ? parseInt(itemData.id, 10) : itemData.id;
          const itemToUpdate = existingDbItems.find(dbItem => dbItem.id === itemId);
          if (itemToUpdate) {
            await itemToUpdate.update(itemUpdateFields);
            associatedDataChanged = true;
            logger.debug('Updated product item', { itemId: itemToUpdate.id });
          } else { // Item with this ID was not found among the product's current items.
            // This means the client sent an item ID that either doesn't belong to this product
            // or doesn't exist. Attempting to create with a specific ID here is risky
            // as it can lead to primary key conflicts if the ID is globally in use.
            // If the intention was to create a new item, the ID should have been omitted.
            logger.warn(
              'Product item for update not found or does not belong to this product. ' +
              'Skipping this item. If it was intended to be a new item, omit the ID.',
              { itemId, productId: id }
            );
          }
        } else { // New item
          await ProductItem.create({
            productId: id,
            ...itemUpdateFields // Spread fields including mapped status
            // Ensure all required fields for ProductItem are present
          });
          associatedDataChanged = true;
          logger.debug('Created new product item', { name: itemData.name });
        }
      }

      // Delete items not present in the request
      const itemsToDelete = existingDbItemIds.filter(dbId => !receivedItemIds.includes(dbId));
      if (itemsToDelete.length > 0) {
        await ProductItem.destroy({ where: { id: itemsToDelete, productId: id } });
        associatedDataChanged = true;
        logger.debug('Deleted product items', { count: itemsToDelete.length });
      }
    }

    // If associated data (media/items) changed, and product's own fields didn't necessarily change (or didn't change updatedAt),
    // explicitly update the product's updatedAt timestamp.
    if (associatedDataChanged) {
      await product.update({ updatedAt: moment().tz('Asia/Ho_Chi_Minh').toDate() });
      logger.debug('Product updatedAt timestamp updated due to item changes', { productId: id });
    }

    // Đảm bảo lấy dữ liệu mới nhất từ database
    await product.reload();

    // Tạo một phiên bản mới để trả về
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductMedia,
          as: 'media',
          attributes: ['id', 'url', 'type', 'altText']
        },
        {
          model: ProductItem,
          as: 'items',
          attributes: ['id', 'name', 'color', 'price', 'originalPrice', 'status']
        }
      ]
    });

    // Kiểm tra và log giá trị updatedAt
    logger.info('Product updated successfully', { 
      id: product.id, 
      name: product.name,
      updatedAt: product.updatedAt // Log thời gian cập nhật
    });

    res.status(200).json({ 
      message: 'Product updated successfully!', 
      data: updatedProduct 
    });
  } catch (error) {
    logger.error('Error updating product', { error });
    throw error;
  }
});