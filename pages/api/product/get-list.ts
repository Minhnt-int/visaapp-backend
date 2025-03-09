import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import Product from '../../../model/Product';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      // Lấy các tham số truy vấn từ URL
      const { page = 1, limit = 10 } = req.query;

      // Chuyển đổi các tham số truy vấn thành số nguyên
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      // Tính toán bù trừ (offset)
      const offset = (pageNumber - 1) * limitNumber;

      // Truy vấn cơ sở dữ liệu với giới hạn và bù trừ
      const products = await Product.findAll({
        limit: limitNumber,
        offset: offset,
      });

      // Truy vấn tổng số sản phẩm để tính tổng số trang
      const totalProducts = await Product.count();
      const totalPages = Math.ceil(totalProducts / limitNumber);

      res.status(200).json({
        data: products,
        meta: {
          totalProducts,
          totalPages,
          currentPage: pageNumber,
          pageSize: limitNumber,
        },
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}