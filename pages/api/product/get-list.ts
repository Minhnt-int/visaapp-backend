import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import Product from '../../../model/Product';
import ProductCategory from '../../../model/ProductCategory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { name, category, page = 1, limit = 10, minPrice, maxPrice } = req.query;

      // Tạo điều kiện tìm kiếm
      const searchConditions: any = {};
      if (name) {
        searchConditions.name = { $like: `%${name}%` }; // Tìm kiếm theo tên
      }
      if (category) {
        searchConditions['$category.name$'] = { $like: `%${category}%` }; // Tìm kiếm theo tên danh mục
      }
      if (minPrice) {
        searchConditions.price = { ...searchConditions.price, $gte: parseFloat(minPrice as string) }; // Tìm kiếm theo giá tối thiểu
      }
      if (maxPrice) {
        searchConditions.price = { ...searchConditions.price, $lte: parseFloat(maxPrice as string) }; // Tìm kiếm theo giá tối đa
      }

      // Tính toán offset cho phân trang
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Tìm kiếm sản phẩm
      const products = await Product.findAll({
        where: searchConditions,
        include: [{
          model: ProductCategory,
          as: 'category',
        }],
        limit: parseInt(limit as string),
        offset: offset,
      });

      res.status(200).json({ data: products });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ message: 'Error searching products', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}