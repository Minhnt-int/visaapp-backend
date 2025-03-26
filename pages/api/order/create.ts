import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import Order, { OrderStatus } from '../../../model/Order';
import OrderItem from '../../../model/OrderItem';
import Product from '../../../model/Product';
import ProductItem, { ProductItemStatus } from '../../../model/ProductItem';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import moment from 'moment-timezone';

// Hàm chuyển đổi giá trị status
const mapStatusValue = (status: string): ProductItemStatus => {
  // Ánh xạ "active" thành "available"
  if (status === 'active') {
    return ProductItemStatus.AVAILABLE;
  }
  
  // Kiểm tra nếu giá trị status thuộc enum ProductItemStatus
  if (Object.values(ProductItemStatus).includes(status as ProductItemStatus)) {
    return status as ProductItemStatus;
  }
  
  // Mặc định trả về AVAILABLE
  return ProductItemStatus.AVAILABLE;
};

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { 
    userId, 
    recipientName, 
    recipientPhone, 
    recipientAddress, 
    notes, 
    items 
  } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!recipientName || !recipientPhone || !recipientAddress) {
    throw new AppError(400, 'Missing required fields', 'VALIDATION_ERROR');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'Order must have at least one item', 'VALIDATION_ERROR');
  }

  // Tạo timestamp
  const timestamp = moment().tz('Asia/Ho_Chi_Minh').toDate();

  try {
    // Tạo đơn hàng
    const order = await Order.create({
      userId: userId || null,
      recipientName,
      recipientPhone,
      recipientAddress,
      notes: notes || '',
      status: OrderStatus.PENDING,
      totalAmount: 0, // Sẽ được cập nhật sau
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Tạo chi tiết đơn hàng
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { productItemId, quantity } = item;

      // Kiểm tra xem productItem có tồn tại không
      const productItem = await ProductItem.findByPk(productItemId);
      if (!productItem) {
        throw new AppError(400, `Product item with ID ${productItemId} not found`, 'NOT_FOUND');
      }

      // Lấy thông tin sản phẩm
      const product = await Product.findByPk(productItem.productId);
      if (!product) {
        throw new AppError(400, `Product with ID ${productItem.productId} not found`, 'NOT_FOUND');
      }

      // Đảm bảo status đúng với enum ProductItemStatus
      const mappedStatus = mapStatusValue(productItem.status);

      // Tạo chi tiết đơn hàng
      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        productItemId: productItem.id,
        quantity: quantity || 1,
        price: productItem.price,
        originalPrice: productItem.originalPrice,
        color: productItem.color,
        productName: product.name,
        itemName: productItem.name,
        itemStatus: mappedStatus,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      totalAmount += orderItem.subtotal;
      orderItems.push(orderItem);
    }

    // Cập nhật tổng tiền cho đơn hàng
    await order.update({ totalAmount });

    res.status(201).json({
      message: 'Order created successfully',
      data: {
        order: {
          ...order.toJSON(),
          items: orderItems.map(item => item.toJSON()),
        },
      },
    });
  } catch (error) {
    // Nếu có lỗi, ném để asyncHandler xử lý
    throw error;
  }
});

export default handler; 