import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import Product from '../../../../model/Product';
import ProductItem, { ProductItemStatus } from '../../../../model/ProductItem';
import moment from 'moment-timezone';
import { asyncHandler, AppError } from '../../../../lib/error-handler';

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { productId, name, color, price, originalPrice, status } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!productId || !name || !color || price === undefined) {
    throw new AppError(400, 'Missing required fields', 'VALIDATION_ERROR');
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

  // Kiểm tra trạng thái hợp lệ
  if (status && !Object.values(ProductItemStatus).includes(status)) {
    throw new AppError(400, 'Invalid status value', 'VALIDATION_ERROR');
  }

  // Kiểm tra sản phẩm có tồn tại
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new AppError(404, 'Product not found', 'NOT_FOUND');
  }

  // Tạo timestamp
  const timestamp = moment().tz('Asia/Ho_Chi_Minh').toDate();

  try {
    // Tạo biến thể sản phẩm
    const productItem = await ProductItem.create({
      productId,
      name,
      color,
      price,
      originalPrice: finalOriginalPrice,
      status: status || ProductItemStatus.AVAILABLE,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    res.status(201).json({
      message: 'Product item created successfully',
      data: productItem,
    });
  } catch (error) {
    throw error;
  }
});

export default handler; 