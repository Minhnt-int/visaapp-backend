import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../model';
import { Op } from 'sequelize';
import { withCors } from '../cors-middleware';
import { verifyToken, verifyAdmin } from '../../../middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      // Xây dựng điều kiện tìm kiếm
      const where = search
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
            ],
          }
        : {};

      // Lấy tổng số user và danh sách user
      const { count, rows } = await User.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password'] }, // Loại bỏ password khỏi kết quả
      });

      return res.status(200).json({
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Wrap handler với CORS và auth middleware
export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  await withCors(req, res, async () => {
    await verifyToken(req, res, async () => {
      await verifyAdmin(req, res, async () => {
        await handler(req, res);
      });
    });
  });
} 