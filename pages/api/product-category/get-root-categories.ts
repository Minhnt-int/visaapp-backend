import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { ProductCategory } from '../../../model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const categories = await ProductCategory.findAll({
        where: { parentId: null },
      });

      res.status(200).json({
        message: 'Root categories fetched successfully!',
        data: categories,
      });
    } catch (error) {
      console.error('Error fetching root categories:', error);
      res.status(500).json({ message: 'Error fetching root categories', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}