import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'PUT') {
    try {
      const { id, name, parentId } = req.body;

      // Tìm danh mục sản phẩm theo ID
      const category = await ProductCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Cập nhật thông tin danh mục sản phẩm
      category.name = name || category.name;
      category.parentId = parentId !== undefined ? parentId : category.parentId;

      await category.save();

      res.status(200).json({ 
        message: 'Category updated successfully!', 
        data: {...category.toJSON(), id: category.id },
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Error updating category', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}