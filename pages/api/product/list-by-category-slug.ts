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

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Slug is required' });
  }

  try {
    // Get category by slug
    const [categoriesResult] = await sequelize.query(
      'SELECT * FROM product_categories WHERE slug = ?',
      { replacements: [slug] }
    );

    if (!Array.isArray(categoriesResult) || categoriesResult.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = categoriesResult[0] as any;

    // Get subcategories
    const [subcategoriesResult] = await sequelize.query(
      'SELECT * FROM product_categories WHERE parentId = ?',
      { replacements: [category.id] }
    );

    const subcategories = Array.isArray(subcategoriesResult) ? subcategoriesResult : [];

    // Create list of all category IDs (including main category and subcategories)
    const allCategoryIds = [category.id, ...subcategories.map((sub: any) => sub.id)];

    // Get count of ACTIVE products
    const [countResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM products WHERE categoryId IN (?) AND status = ?',
      { replacements: [allCategoryIds, ProductStatus.ACTIVE] }
    );
    
    const count = (countResult as any[])[0].count;
    const totalPages = Math.ceil(count / itemsPerPage);

    // Get products from this category and subcategories, only ACTIVE products
    const [productsResult] = await sequelize.query(
      `SELECT p.*, c.name as categoryName, c.slug as categorySlug 
       FROM products p 
       JOIN product_categories c ON p.categoryId = c.id
       WHERE p.categoryId IN (${allCategoryIds.join(',')})
       AND p.status = ?
       ORDER BY p.createdAt DESC
       LIMIT ? OFFSET ?`,
      { replacements: [ProductStatus.ACTIVE, itemsPerPage, offset] }
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