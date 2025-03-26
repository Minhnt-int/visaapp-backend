import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import Order from '../../../model/Order';
import OrderItem from '../../../model/OrderItem';
import ProductItem, { ProductItemStatus } from '../../../model/ProductItem';
import Product from '../../../model/Product';
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
  await connectToDatabase();

  // POST: Thêm sản phẩm vào đơn hàng
  if (req.method === 'POST') {
    const { orderId, productItemId, quantity } = req.body;

    if (!orderId || !productItemId) {
      throw new AppError(400, 'Missing required fields', 'VALIDATION_ERROR');
    }

    // Kiểm tra đơn hàng có tồn tại không
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }

    // Kiểm tra sản phẩm có tồn tại không
    const productItem = await ProductItem.findByPk(productItemId);
    if (!productItem) {
      throw new AppError(404, 'Product item not found', 'NOT_FOUND');
    }

    // Đảm bảo status đúng với enum ProductItemStatus
    const mappedStatus = mapStatusValue(productItem.status);

    // Kiểm tra xem đã có sản phẩm này trong đơn hàng chưa
    const existingItem = await OrderItem.findOne({
      where: {
        orderId,
        productItemId,
      },
    });

    // Nếu đã có, cập nhật số lượng
    if (existingItem) {
      const newQuantity = existingItem.quantity + (quantity || 1);
      await existingItem.update({ 
        quantity: newQuantity,
        // Subtotal được tính tự động bởi hook
      });

      // Cập nhật tổng tiền đơn hàng
      const allItems = await OrderItem.findAll({
        where: { orderId },
      });
      
      const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal, 0);
      await order.update({ totalAmount });

      res.status(200).json({
        message: 'Order item updated successfully',
        data: await existingItem.reload(),
      });
    } 
    // Nếu chưa có, tạo mới
    else {
      // Lấy thông tin sản phẩm
      const product = await Product.findByPk(productItem.productId);
      if (!product) {
        throw new AppError(404, 'Product not found', 'NOT_FOUND');
      }

      const timestamp = moment().tz('Asia/Ho_Chi_Minh').toDate();

      // Tạo chi tiết đơn hàng mới
      const orderItem = await OrderItem.create({
        orderId,
        productId: product.id,
        productItemId,
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

      // Cập nhật tổng tiền đơn hàng
      const allItems = await OrderItem.findAll({
        where: { orderId },
      });
      
      const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal, 0);
      await order.update({ totalAmount });

      res.status(201).json({
        message: 'Order item added successfully',
        data: orderItem,
      });
    }
  } 
  // PUT: Cập nhật số lượng sản phẩm trong đơn hàng
  else if (req.method === 'PUT') {
    const { orderItemId, quantity } = req.body;

    if (!orderItemId || quantity === undefined) {
      throw new AppError(400, 'Missing required fields', 'VALIDATION_ERROR');
    }

    // Kiểm tra item có tồn tại không
    const orderItem = await OrderItem.findByPk(orderItemId);
    if (!orderItem) {
      throw new AppError(404, 'Order item not found', 'NOT_FOUND');
    }

    // Cập nhật số lượng
    await orderItem.update({ quantity });

    // Cập nhật tổng tiền đơn hàng
    const order = await Order.findByPk(orderItem.orderId);
    if (order) {
      const allItems = await OrderItem.findAll({
        where: { orderId: order.id },
      });
      
      const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal, 0);
      await order.update({ totalAmount });
    }

    res.status(200).json({
      message: 'Order item updated successfully',
      data: await orderItem.reload(),
    });
  } 
  // DELETE: Xóa sản phẩm khỏi đơn hàng
  else if (req.method === 'DELETE') {
    const { orderItemId } = req.body;

    if (!orderItemId) {
      throw new AppError(400, 'Missing required fields', 'VALIDATION_ERROR');
    }

    // Kiểm tra item có tồn tại không
    const orderItem = await OrderItem.findByPk(orderItemId);
    if (!orderItem) {
      throw new AppError(404, 'Order item not found', 'NOT_FOUND');
    }

    const orderId = orderItem.orderId;

    // Xóa item
    await orderItem.destroy();

    // Cập nhật tổng tiền đơn hàng
    const order = await Order.findByPk(orderId);
    if (order) {
      const allItems = await OrderItem.findAll({
        where: { orderId },
      });
      
      const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal, 0);
      await order.update({ totalAmount });
    }

    res.status(200).json({
      message: 'Order item deleted successfully',
    });
  } 
  // Phương thức không được hỗ trợ
  else {
    res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }
});

export default handler; 