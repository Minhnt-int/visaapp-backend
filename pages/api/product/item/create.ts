import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { Product, ProductItem, ProductItemStatus, ProductMedia } from '../../../../model';
import moment from 'moment-timezone';
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
  if (req.method !== 'POST') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { productId, name, color, price, originalPrice, status, mediaId } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!productId || !name || !color || price === undefined) {
    throw new AppError(400, 'Missing required fields: productId, name, color, price', 'VALIDATION_ERROR');
  }

  // Kiểm tra mediaId nếu được cung cấp
  if (mediaId) {
    const media = await ProductMedia.findOne({
      where: { id: mediaId, productId: productId }
    });
    if (!media) {
      throw new AppError(400, 'Media not found or does not belong to this product', 'VALIDATION_ERROR');
    }
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

  // Xử lý trạng thái, không cần kiểm tra nữa vì đã có hàm mapStatusValue
  const mappedStatus = mapStatusValue(status || 'available');

  // Kiểm tra sản phẩm có tồn tại
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new AppError(404, 'Product not found', 'NOT_FOUND');
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
      mediaId: mediaId || null
    });

    res.status(201).json({
      message: 'Product item created successfully',
      data: newItem,
    });
  } catch (error) {
    throw error;
  }
});

export default handler;