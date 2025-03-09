import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      const offset = (pageNumber - 1) * limitNumber;

      const { count, rows } = await ProductCategory.findAndCountAll({
        offset,
        limit: limitNumber,
      });

      res.status(200).json({
        message: 'Categories fetched successfully!',
        data: rows,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(count / limitNumber),
        },
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Error fetching categories', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}