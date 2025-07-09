import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductMedia, ProductItem, ProductCategory } from '../../../model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { slug } = req.query;

      // Tìm sản phẩm theo slug
      const product = await Product.findOne({
        where: { slug },
        include: [
          {
            model: ProductMedia,
            as: 'media',
            attributes: ['id', 'url', 'type', 'altText']
          },
          {
            model: ProductItem,
            as: 'items',
            attributes: ['id', 'name', 'color', 'price', 'originalPrice', 'status', 'mediaIds'] // Thay mediaId bằng mediaIds
          }
        ]
      });

      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: 'Product not found' 
        });
      }

      // Lấy data dạng plain object
      const productData = product.get({ plain: true }) as any;

      // Lấy tên category từ categoryId
      if (productData.categoryId) {
        const category = await ProductCategory.findByPk(productData.categoryId);
        if (category) {
          productData.categoryName = category.name;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Product fetched successfully!',
        data: productData,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching product', 
        error: (error as any).message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`
    });
  }
}