import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { Product, ProductItem, ProductItemStatus, ProductMedia } from '../../../../model';
import moment from 'moment-timezone';
import { asyncHandler, AppError } from '../../../../lib/error-handler';
import logger from '../../../../lib/logger';

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

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { productId, name, color, price, originalPrice, status, mediaIndex } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!productId || !name || !color || price === undefined) {
    throw new AppError(400, 'Missing required fields: productId, name, color, price', 'VALIDATION_ERROR');
  }

  // Kiểm tra giá hợp lệ
  if (price < 0) {
    throw new AppError(400, 'Price must be a positive number', 'VALIDATION_ERROR');
  }

  // Kiểm tra giá gốc hợp lệ
  const finalOriginalPrice = originalPrice === undefined ? price : originalPrice;
  if (finalOriginalPrice < 0) {
    throw new AppError(400, 'Original price must be a positive number', 'VALIDATION_ERROR');
  }

  // Kiểm tra sản phẩm có tồn tại
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new AppError(404, 'Product not found', 'NOT_FOUND');
  }

  // Xử lý trạng thái
  const mappedStatus = mapStatusValue(status || 'available');

  // Xử lý mediaIndex thành mediaIds
  let finalMediaIds: number[] = [];
  if (mediaIndex !== undefined) {
    if (Array.isArray(mediaIndex) && mediaIndex.length > 0) {
      // Lấy tất cả media của product này theo thứ tự
      const allProductMedia = await ProductMedia.findAll({
        where: { productId },
        order: [['id', 'ASC']]
      });

      logger.debug('Processing mediaIndex for new item', {
        productId,
        receivedMediaIndex: mediaIndex,
        availableMediaCount: allProductMedia.length,
        availableMedia: allProductMedia.map(m => ({ id: m.id, url: m.url }))
      });

      // Validate và chuyển đổi mediaIndex thành mediaIds
      const validMediaIds = [];
      for (const index of mediaIndex) {
        if (!Number.isInteger(index) || index < 0) {
          throw new AppError(400, `MediaIndex must be non-negative integers, got: ${index}`, 'VALIDATION_ERROR');
        }
        
        if (index >= 0 && index < allProductMedia.length) {
          const actualMediaId = allProductMedia[index].id;
          validMediaIds.push(actualMediaId);
          logger.debug(`Converted index ${index} → Media ID ${actualMediaId}`);
        } else {
          throw new AppError(400, `Media index ${index} is invalid for product ${productId}. Available indices: 0-${allProductMedia.length - 1}`, 'VALIDATION_ERROR');
        }
      }

      // Lưu dạng array thay vì JSON string
      finalMediaIds = validMediaIds.length > 0 ? validMediaIds : [];
      
      logger.debug('Media assignment for new item', {
        itemName: name,
        receivedIndexes: mediaIndex,
        convertedToIds: validMediaIds,
        finalMediaIds
      });
    } else if (mediaIndex !== null) {
      throw new AppError(400, 'MediaIndex must be an array of non-negative integers', 'VALIDATION_ERROR');
    }
  }

  // Tạo timestamp
  const timestamp = moment().tz('Asia/Ho_Chi_Minh').toDate();

  try {
    const newItem = await ProductItem.create({
      productId,
      name,
      color,
      price,
      originalPrice: finalOriginalPrice,
      status: mappedStatus,
      mediaIds: finalMediaIds, // Lưu dạng array of numbers
      createdAt: timestamp,
      updatedAt: timestamp
    });

    logger.info('Product item created successfully', {
      itemId: newItem.id,
      productId,
      name,
      mediaIds: finalMediaIds
    });

    res.status(201).json({
      success: true,
      message: 'Product item created successfully',
      data: newItem,
    });
  } catch (error) {
    logger.error('Error creating product item', {
      productId,
      name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

export default handler;