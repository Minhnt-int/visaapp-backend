import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory, ProductItem, ProductMedia, ProductStatus } from '../../../model';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status as string || ProductStatus.ACTIVE;

    // Xây dựng where condition
    const whereCondition: any = {};
    
    // Nếu status là 'all' thì không cần filter
    if (status !== 'all') {
      // Nếu status là một trong các giá trị hợp lệ của ProductStatus
      if (Object.values(ProductStatus).includes(status as any)) {
        whereCondition.status = status;
      } else {
        // Mặc định lấy sản phẩm ACTIVE
        whereCondition.status = ProductStatus.ACTIVE;
      }
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: ProductItem,
          as: 'items',
          attributes: ['id', 'name', 'color', 'price', 'originalPrice', 'status'],
        },
        {
          model: ProductMedia,
          as: 'media',
          attributes: ['id', 'type', 'url'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
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
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}