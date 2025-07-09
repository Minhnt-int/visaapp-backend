import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { ProductItem, ProductItemStatus, ProductMedia } from '../../../../model';
import { asyncHandler, AppError } from '../../../../lib/error-handler';

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
  if (req.method !== 'PUT') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { id, name, color, price, originalPrice, status, mediaId } = req.body;

  // Kiểm tra ID
  if (!id) {
    throw new AppError(400, 'Missing product item ID', 'VALIDATION_ERROR');
  }

  // Tìm ProductItem
  const productItem = await ProductItem.findByPk(id);
  if (!productItem) {
    throw new AppError(404, 'Product item not found', 'NOT_FOUND');
  }

  // Cập nhật dữ liệu
  const updateData: any = {};
  
  if (name !== undefined) {
    updateData.name = name;
  }
  
  if (color !== undefined) {
    updateData.color = color;
  }
  
  if (price !== undefined) {
    if (price < 0) {
      throw new AppError(400, 'Price must be a positive number', 'VALIDATION_ERROR');
    }
    updateData.price = price;
  }
  
  if (originalPrice !== undefined) {
    if (originalPrice < 0) {
      throw new AppError(400, 'Original price must be a positive number', 'VALIDATION_ERROR');
    }
    updateData.originalPrice = originalPrice;
  }
  
  if (status !== undefined) {
    // Chuyển đổi giá trị status từ request
    updateData.status = mapStatusValue(status);
  }

  // Kiểm tra mediaId nếu được cung cấp
  if (mediaId !== undefined) {
    if (mediaId !== null) {
      const media = await ProductMedia.findOne({
        where: { id: mediaId, productId: productItem.productId }
      });
      if (!media) {
        throw new AppError(400, 'Media not found or does not belong to this product', 'VALIDATION_ERROR');
      }
    }
    updateData.mediaId = mediaId;
  }

  try {
    // Cập nhật ProductItem
    await productItem.update(updateData);

    res.status(200).json({
      message: 'Product item updated successfully',
      data: await productItem.reload(),
    });
  } catch (error) {
    throw error;
  }
});

export default handler;