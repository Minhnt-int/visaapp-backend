import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory } from '../../../model';
import moment from 'moment-timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'PUT') {
    try {
      const { 
        id, name, description, shortDescription, categoryId, slug, 
        metaTitle, metaDescription, metaKeywords,
        items, media 
      } = req.body;

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

      // Build update object
      const updateFields: any = {};
      if (name) updateFields.name = name;
      if (description !== undefined) updateFields.description = description;
      if (shortDescription !== undefined) updateFields.shortDescription = shortDescription;
      if (categoryId) updateFields.categoryId = categoryId;
      if (slug) updateFields.slug = slug;
      if (metaTitle !== undefined) updateFields.metaTitle = metaTitle;
      if (metaDescription !== undefined) updateFields.metaDescription = metaDescription;
      if (metaKeywords !== undefined) updateFields.metaKeywords = metaKeywords;

      // Cập nhật sản phẩm
      await product.update(updateFields);

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