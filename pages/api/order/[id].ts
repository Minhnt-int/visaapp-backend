import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import Order, { OrderStatus } from '../../../model/Order';
import OrderItem from '../../../model/OrderItem';
import { asyncHandler, AppError } from '../../../lib/error-handler';

// Hàm chuyển đổi giá trị status cho Order
const mapOrderStatusValue = (status: string): OrderStatus => {
  // Kiểm tra nếu giá trị status thuộc enum OrderStatus
  if (Object.values(OrderStatus).includes(status as OrderStatus)) {
    return status as OrderStatus;
  }
  
  // Ánh xạ một số trường hợp phổ biến
  if (status === 'processing') return OrderStatus.CONFIRMED;
  if (status === 'shipped') return OrderStatus.SHIPPING;
  if (status === 'completed') return OrderStatus.DELIVERED;
  if (status === 'cancelled' || status === 'canceled') return OrderStatus.CANCELLED;
  
  // Mặc định trả về PENDING
  return OrderStatus.PENDING;
};

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  await connectToDatabase();

  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Invalid order ID', 'VALIDATION_ERROR');
  }

  // GET: Lấy chi tiết đơn hàng
  if (req.method === 'GET') {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    if (!order) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }

    res.status(200).json({
      message: 'Order fetched successfully',
      data: order,
    });
  } 
  // PUT: Cập nhật đơn hàng
  else if (req.method === 'PUT') {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }

    const { status, recipientName, recipientPhone, recipientAddress, notes } = req.body;

    const updateData: any = {};
    
    // Chỉ cập nhật các trường được cung cấp
    if (status !== undefined) {
      // Đảm bảo status đúng với enum OrderStatus
      updateData.status = mapOrderStatusValue(status);
    }
    
    if (recipientName !== undefined) {
      updateData.recipientName = recipientName;
    }
    
    if (recipientPhone !== undefined) {
      updateData.recipientPhone = recipientPhone;
    }
    
    if (recipientAddress !== undefined) {
      updateData.recipientAddress = recipientAddress;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await order.update(updateData);

    // Lấy lại đơn hàng với thông tin cập nhật và các item
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    res.status(200).json({
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } 
  // DELETE: Xóa đơn hàng
  else if (req.method === 'DELETE') {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }

    // Đầu tiên xóa tất cả các item trong đơn hàng
    await OrderItem.destroy({
      where: {
        orderId: order.id,
      },
    });

    // Sau đó xóa đơn hàng
    await order.destroy();

    res.status(200).json({
      message: 'Order deleted successfully',
    });
  } 
  // Phương thức không được hỗ trợ
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }
});

export default handler; 