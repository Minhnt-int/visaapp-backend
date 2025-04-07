import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectToDatabase();
  const { slug, page = '1', limit = '10' } = req.query;
  const currentPage = parseInt(page as string, 10) || 1;
  const itemsPerPage = parseInt(limit as string, 10) || 10;
  const offset = (currentPage - 1) * itemsPerPage;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Slug is required' });
  }

  try {
    // Lấy thông tin về danh mục
    const [categoriesResult] = await sequelize.query(
      'SELECT * FROM product_categories WHERE slug = ?',
      { replacements: [slug] }
    );

    if (!Array.isArray(categoriesResult) || categoriesResult.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = categoriesResult[0] as any;
    console.log('Tìm thấy danh mục:', category);

    // Lấy danh mục con
    const [subcategoriesResult] = await sequelize.query(
      'SELECT * FROM product_categories WHERE parentId = ?',
      { replacements: [category.id] }
    );

    const subcategories = Array.isArray(subcategoriesResult) ? subcategoriesResult : [];
    console.log(`Tìm thấy ${subcategories.length} danh mục con`);

    // Tạo danh sách tất cả ID danh mục (bao gồm cả danh mục chính và danh mục con)
    const allCategoryIds = [category.id, ...subcategories.map((sub: any) => sub.id)];
    console.log('Danh sách categoryId:', allCategoryIds.join(', '));

    // Lấy số lượng sản phẩm
    const [countResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM products WHERE categoryId IN (?)',
      { replacements: [allCategoryIds] }
    );
    
    const count = (countResult as any[])[0].count;
    const totalPages = Math.ceil(count / itemsPerPage);

    // Lấy các sản phẩm thuộc danh mục này và danh mục con
    const [productsResult] = await sequelize.query(
      `SELECT p.*, c.name as categoryName, c.slug as categorySlug 
       FROM products p 
       JOIN product_categories c ON p.categoryId = c.id
       WHERE p.categoryId IN (${allCategoryIds.join(',')})
       ORDER BY p.createdAt DESC
       LIMIT ? OFFSET ?`,
      { replacements: [itemsPerPage, offset] }
    );

    const products = Array.isArray(productsResult) ? productsResult : [];
    console.log(`Tìm thấy ${products.length} sản phẩm thuộc danh mục này và các danh mục con`);

    // Lấy thông tin biến thể và media cho các sản phẩm
    // (Đây là bước bổ sung tùy chọn, có thể bỏ qua nếu không cần)
    for (const product of products as any[]) {
      // Lấy biến thể sản phẩm
      const [itemsResult] = await sequelize.query(
        'SELECT * FROM product_items WHERE productId = ?',
        { replacements: [product.id] }
      );
      product.items = Array.isArray(itemsResult) ? itemsResult : [];
      
      // Lấy media sản phẩm
      const [mediaResult] = await sequelize.query(
        'SELECT * FROM product_media WHERE productId = ? LIMIT 5',
        { replacements: [product.id] }
      );
      product.media = Array.isArray(mediaResult) ? mediaResult : [];
    }

    return res.status(200).json({
      message: 'Products retrieved successfully',
      data: {
        category,
        subcategories,
        products,
        pagination: {
          total: Number(count),
          totalPages,
          currentPage,
          itemsPerPage
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}); 