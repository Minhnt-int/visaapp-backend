import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';
import Product from '../../../model/Product';
import ProductMedia from '../../../model/ProductMedia';
import moment from 'moment-timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'POST') {
    try {
      const { name, price, description, categoryId, slug, metaTitle, metaDescription, metaKeywords, media } = req.body;

      // Kiểm tra xem danh mục có tồn tại không
      const category = await ProductCategory.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }

      // // Kiểm tra xem slug có tồn tại không
      // const existingProduct = await Product.findOne({ where: { slug } });
      // if (existingProduct) {
      //   return res.status(400).json({ message: 'Slug already exists' });
      // }

      // Thiết lập múi giờ cho createdAt và updatedAt
      const createdAt = moment().tz('Asia/Ho_Chi_Minh').toDate();
      const updatedAt = createdAt;

      // Tạo sản phẩm mới
      const newProduct = await Product.create({
        name,
        price,
        description,
        categoryId,
        slug,
        metaTitle,
        metaDescription,
        metaKeywords,
        createdAt,
        updatedAt,
      });

      // Thêm thông tin media cho sản phẩm
      if (media && media.length > 0) {
        const mediaPromises = media.map((mediaItem: { type: 'image' | 'video'; url: string }) => {
          return ProductMedia.create({
            productId: newProduct.id,
            type: mediaItem.type,
            url: mediaItem.url,
            createdAt,
            updatedAt,
          });
        });
        await Promise.all(mediaPromises);
      }

      res.status(201).json({ message: 'Product created successfully!', data: {...newProduct , id: newProduct.id}});
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Error creating product', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}