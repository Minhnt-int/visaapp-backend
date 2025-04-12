import type { NextApiRequest, NextApiResponse } from 'next';
import { Order, OrderStatus, OrderItem } from '../../../model';
import { connectToDatabase } from '../../../lib/db';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import { Op } from 'sequelize';

// Hàm chuyển đổi giá trị status cho Order
const mapOrderStatusValue = (status: string): string => {
  // Kiểm tra nếu giá trị status thuộc enum OrderStatus
  if (Object.values(OrderStatus).includes(status)) {
    return status;
  }
  
  // Ánh xạ một số trường hợp phổ biến
  if (status === 'processing') return OrderStatus.PROCESSING;
  if (status === 'shipped') return OrderStatus.SHIPPED;
  if (status === 'completed') return OrderStatus.DELIVERED;
  if (status === 'cancelled' || status === 'canceled') return OrderStatus.CANCELLED;
  
  // Mặc định trả về PENDING
  return OrderStatus.PENDING;
};

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { 
    userId, 
    status, 
    page = 1, 
    limit = 10, 
    startDate, 
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  const offset = (pageNumber - 1) * limitNumber;

  // Xây dựng điều kiện tìm kiếm
  const whereConditions: any = {};

  if (userId) {
    whereConditions.userId = userId;
  }

  if (status) {
    // Đảm bảo status đúng với enum OrderStatus
    whereConditions.status = mapOrderStatusValue(status as string);
  }

  // Nếu có ngày bắt đầu và kết thúc, tìm các đơn hàng trong khoảng thời gian
  if (startDate && endDate) {
    whereConditions.createdAt = {
      [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  } else if (startDate) {
    whereConditions.createdAt = {
      [Op.gte]: new Date(startDate as string)
    };
  } else if (endDate) {
    whereConditions.createdAt = {
      [Op.lte]: new Date(endDate as string)
    };
  }

  // Xác định trường sắp xếp
  const validSortFields = ['id', 'createdAt', 'updatedAt', 'totalAmount', 'status'];
  const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
  
  // Xác định hướng sắp xếp
  const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  try {
    // Tìm đơn hàng và đếm tổng số
    const { count, rows } = await Order.findAndCountAll({
      where: whereConditions,
      limit: limitNumber,
      offset,
      order: sortField ? [[sortField as string, sortDirection as string]] : [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Orders fetched successfully',
      data: rows,
      pagination: {
        total: count,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(count / limitNumber),
      },
    });
  } catch (error) {
    throw error;
  }
});

export default handler; 