import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';
import Product from '../../../model/Product';
import moment from 'moment-timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'PUT') {
    try {
      const { id, name, price, description, categoryId, slug, metaTitle, metaDescription, metaKeywords } = req.body;

      // Kiểm tra xem sản phẩm có tồn tại không
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Kiểm tra xem danh mục có tồn tại không
      const category = await ProductCategory.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }

      // Thiết lập múi giờ cho updatedAt
      const updatedAt = moment().tz('Asia/Ho_Chi_Minh').toDate();

      // Cập nhật sản phẩm
      await product.update({
        name,
        price,
        description,
        categoryId,
        slug,
        metaTitle,
        metaDescription,
        metaKeywords,
        updatedAt,
      });

      res.status(200).json({ message: 'Product updated successfully!', data: product });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}