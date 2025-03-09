import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import Product from '../../../model/Product';
import ProductMedia from '../../../model/ProductMedia';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { slug } = req.query;

      // Tìm sản phẩm theo slug và bao gồm thông tin media
      const product = await Product.findOne({
        where: { slug },
        include: [{
          model: ProductMedia,
          as: 'media'
        }]
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json({
        message: 'Product fetched successfully!',
        data: product,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}