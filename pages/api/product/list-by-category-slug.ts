import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import { ProductStatus } from '../../../model';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectToDatabase();
  const { slug, page = '1', limit = '10' } = req.query;
  const currentPage = parseInt(page as string, 10) || 1;
  const itemsPerPage = parseInt(limit as string, 10) || 10;
  const offset = (currentPage - 1) * itemsPerPage;

  try {
    let allCategoryIds: any[] = [];
    let categoryInfo = null;

    // Nếu có slug, lấy sản phẩm theo danh mục cụ thể
    if (slug && typeof slug === 'string') {
      // Get category by slug
      const [categoriesResult] = await sequelize.query(
        'SELECT * FROM product_categories WHERE slug = ?',
        { replacements: [slug] }
      );

      if (!Array.isArray(categoriesResult) || categoriesResult.length === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const category = categoriesResult[0] as any;
      categoryInfo = category;

      // Get subcategories
      const [subcategoriesResult] = await sequelize.query(
        'SELECT * FROM product_categories WHERE parentId = ?',
        { replacements: [category.id] }
      );

      const subcategories = Array.isArray(subcategoriesResult) ? subcategoriesResult : [];

      // Create list of all category IDs (including main category and subcategories)
      allCategoryIds = [category.id, ...subcategories.map((sub: any) => sub.id)];
    }

    // Tạo câu truy vấn SQL dựa vào việc có slug hay không
    let countQuery = 'SELECT COUNT(*) as count FROM products WHERE status = ?';
    let productsQuery = `
      SELECT p.*, c.name as categoryName, c.slug as categorySlug 
      FROM products p 
      JOIN product_categories c ON p.categoryId = c.id
      WHERE p.status = ?`;
    
    let countReplacements: any[] = [ProductStatus.ACTIVE];
    let productsReplacements: any[] = [ProductStatus.ACTIVE];

    // Nếu có danh mục cụ thể, thêm điều kiện vào truy vấn
    if (allCategoryIds.length > 0) {
      countQuery += ' AND categoryId IN (?)';
      productsQuery += ` AND p.categoryId IN (${allCategoryIds.join(',')})`;
      countReplacements.push(allCategoryIds);
    }

    // Hoàn thành câu truy vấn với phân trang
    productsQuery += ' ORDER BY p.createdAt DESC LIMIT ? OFFSET ?';
    productsReplacements.push(itemsPerPage, offset);

    // Thực hiện truy vấn đếm số lượng
    const [countResult] = await sequelize.query(
      countQuery,
      { replacements: countReplacements }
    );
    
    const count = (countResult as any[])[0].count;
    const totalPages = Math.ceil(count / itemsPerPage);

    // Thực hiện truy vấn lấy sản phẩm
    const [productsResult] = await sequelize.query(
      productsQuery,
      { replacements: productsReplacements }
    );

    const products = Array.isArray(productsResult) ? productsResult : [];

    // Get product items and media
    for (const product of products as any[]) {
      // Get product items
      const [itemsResult] = await sequelize.query(
        'SELECT * FROM product_items WHERE productId = ?',
        { replacements: [product.id] }
      );
      product.items = Array.isArray(itemsResult) ? itemsResult : [];
      
      // Get product media
      const [mediaResult] = await sequelize.query(
        'SELECT * FROM product_media WHERE productId = ? LIMIT 5',
        { replacements: [product.id] }
      );
      product.media = Array.isArray(mediaResult) ? mediaResult : [];
    }

    return res.status(200).json({
      message: 'Products retrieved successfully',
      data: {
        products,
        category: categoryInfo,
        pagination: {
          total: Number(count),
          totalPages,
          currentPage,
          itemsPerPage
        }
      }
    });
  } catch (error) {
    logger.error('Error retrieving products:', error);
    throw new AppError(500, 'Internal server error', 'SERVER_ERROR');
  }
}); 