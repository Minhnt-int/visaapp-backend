import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory, ProductMedia } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
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