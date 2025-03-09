// filepath: /Users/duy/nextjs project/web-qua-tang/pages/api/product-category/create-category.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'POST') {
    try {
      const { name, parentId } = req.body;
      // Tạo danh mục sản phẩm mới
      const newCategory = ProductCategory.build({
        name,
        parentId: parentId || null, // Nếu không có parentId, đặt là null
      }, { isNewRecord: true });

      await newCategory.save();

      res.status(201).json({ 
        message: 'Category created successfully!', 
        data: {...newCategory.toJSON(), id: newCategory.id },
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Error creating category', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}