import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import Product from '../../../model/Product';
import ProductMedia from '../../../model/ProductMedia';
import ProductItem from '../../../model/ProductItem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { slug } = req.query;

      // Tìm sản phẩm theo slug và bao gồm thông tin media và items (tên, màu sắc, giá, giá gốc và trạng thái)
      const product = await Product.findOne({
        where: { slug },
        include: [
          {
            model: ProductMedia,
            as: 'media'
          },
          {
            model: ProductItem,
            as: 'items',
            attributes: ['id', 'name', 'color', 'price', 'originalPrice', 'status'] // Thêm trường originalPrice
          }
        ]
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