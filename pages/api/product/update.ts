import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory, ProductMedia } from '../../../model';
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
      avatarUrl, media
    } = req.body;

    logger.debug('Updating product', { id, name, categoryId, avatarUrl });

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(id);
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
      logger.debug('Updating product media', { 
        productId: id,
        mediaCount: media.length 
      });

      // Xử lý từng media
      for (const mediaItem of media) {
        if (mediaItem.id) {
          // Cập nhật media hiện có
          const existingMedia = await ProductMedia.findOne({
            where: { id: mediaItem.id, productId: id }
          });

          if (existingMedia) {
            await existingMedia.update({
              type: mediaItem.type || existingMedia.type,
              url: mediaItem.url || existingMedia.url,
              altText: mediaItem.altText
            });
            logger.debug('Updated existing media', { 
              mediaId: existingMedia.id,
              productId: id
            });
          }
        } else {
          // Thêm media mới
          await ProductMedia.create({
            productId: id,
            type: mediaItem.type,
            url: mediaItem.url,
            altText: mediaItem.altText
          });
          logger.debug('Added new media', { productId: id });
        }
      }
    }

    // Trả về sản phẩm với dữ liệu đã cập nhật
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
        }
      ]
    });

    logger.info('Product updated successfully', { 
      id: product.id, 
      name: product.name,
      avatarUrl: updateFields.avatarUrl
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