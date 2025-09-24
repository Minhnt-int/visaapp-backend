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
  const { 
    slug, 
    page = '1', 
    limit = '10',
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    minPrice,
    maxPrice
  } = req.query;
  
  const currentPage = parseInt(page as string, 10) || 1;
  const itemsPerPage = parseInt(limit as string, 10) || 10;
  const offset = (currentPage - 1) * itemsPerPage;

  try {
    let allCategoryIds: number[] = [];
    let categoryInfo = null;

    // STEP 1: Get category and subcategories (nếu có slug)
    if (slug && typeof slug === 'string') {
      // Get main category
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
      allCategoryIds = [category.id, ...subcategories.map((sub: any) => sub.id)];
    }

    // STEP 2: Build queries với category filter
    let countQuery = 'SELECT COUNT(*) as count FROM products p JOIN product_categories c ON p.categoryId = c.id WHERE p.status = ?';
    let productsQuery = `
      SELECT p.*, c.name as categoryName, c.slug as categorySlug 
      FROM products p 
      JOIN product_categories c ON p.categoryId = c.id
      WHERE p.status = ?`;

    let countReplacements: any[] = [ProductStatus.ACTIVE];
    let productsReplacements: any[] = [ProductStatus.ACTIVE];

    // Add category filter if slug provided
    if (allCategoryIds.length > 0) {
      const placeholders = allCategoryIds.map(() => '?').join(',');
      countQuery += ` AND p.categoryId IN (${placeholders})`;
      productsQuery += ` AND p.categoryId IN (${placeholders})`;
      countReplacements.push(...allCategoryIds);
      productsReplacements.push(...allCategoryIds);
    }

    // Add search functionality
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const searchCondition = ` AND (p.name LIKE ? OR p.description LIKE ? OR p.shortDescription LIKE ? OR c.name LIKE ?)`;
      
      countQuery += searchCondition;
      productsQuery += searchCondition;
      
      // Add search parameters for all queries
      const searchParams = [searchTerm, searchTerm, searchTerm, searchTerm];
      countReplacements.push(...searchParams);
      productsReplacements.push(...searchParams);
    }

    // Add price filter functionality
    if (minPrice || maxPrice) {
      let priceCondition = ` AND p.id IN (
        SELECT DISTINCT pi.productId 
        FROM product_items pi 
        WHERE `;
      
      const priceConditions = [];
      if (minPrice) {
        priceConditions.push('pi.price >= ?');
        countReplacements.push(parseFloat(minPrice as string));
        productsReplacements.push(parseFloat(minPrice as string));
      }
      if (maxPrice) {
        priceConditions.push('pi.price <= ?');
        countReplacements.push(parseFloat(maxPrice as string));
        productsReplacements.push(parseFloat(maxPrice as string));
      }
      
      priceCondition += priceConditions.join(' AND ') + ')';
      countQuery += priceCondition;
      productsQuery += priceCondition;
    }

    // Add sorting
    const validSortFields = ['id', 'name', 'title', 'createdAt', 'updatedAt', 'categoryName', 'price'];
    const sanitizedSortBy = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const sanitizedSortOrder = (sortOrder as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Handle price sorting - need to join with product_items and get min price
    if (sanitizedSortBy === 'price') {
      // Modify the products query to include price sorting
      productsQuery = `
        SELECT p.*, c.name as categoryName, c.slug as categorySlug, MIN(pi.price) as minPrice
        FROM products p 
        JOIN product_categories c ON p.categoryId = c.id
        LEFT JOIN product_items pi ON p.id = pi.productId
        WHERE p.status = ?`;
      
      // Re-add all the conditions with GROUP BY for price aggregation
      let tempReplacements: any[] = [ProductStatus.ACTIVE];
      
      if (allCategoryIds.length > 0) {
        const placeholders = allCategoryIds.map(() => '?').join(',');
        productsQuery += ` AND p.categoryId IN (${placeholders})`;
        tempReplacements.push(...allCategoryIds);
      }
      
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        productsQuery += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.shortDescription LIKE ? OR c.name LIKE ?)`;
        tempReplacements.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (minPrice || maxPrice) {
        const priceConditions = [];
        if (minPrice) {
          priceConditions.push('pi.price >= ?');
          tempReplacements.push(parseFloat(minPrice as string));
        }
        if (maxPrice) {
          priceConditions.push('pi.price <= ?');
          tempReplacements.push(parseFloat(maxPrice as string));
        }
        productsQuery += ` AND (${priceConditions.join(' AND ')})`;
      }
      
      productsQuery += ` GROUP BY p.id, c.id ORDER BY minPrice ${sanitizedSortOrder} LIMIT ? OFFSET ?`;
      productsReplacements = [...tempReplacements, itemsPerPage, offset];
      
    } else {
      // Normal sorting for non-price fields
      let orderByColumn = sanitizedSortBy;
      if (sanitizedSortBy === 'categoryName') {
        orderByColumn = 'c.name';
      } else {
        orderByColumn = `p.${sanitizedSortBy}`;
      }
      
      productsQuery += ` ORDER BY ${orderByColumn} ${sanitizedSortOrder} LIMIT ? OFFSET ?`;
      productsReplacements.push(itemsPerPage, offset);

    }

    // STEP 3: Execute count và products queries
    // For price sorting, we need a different count query since we're using GROUP BY
    let finalCountQuery = countQuery;
    let finalCountReplacements = countReplacements;
    
    if (sanitizedSortBy === 'price') {
      // Count distinct products when using price sorting (because of GROUP BY)
      finalCountQuery = `SELECT COUNT(DISTINCT p.id) as count FROM products p 
        JOIN product_categories c ON p.categoryId = c.id
        LEFT JOIN product_items pi ON p.id = pi.productId
        WHERE p.status = ?`;
      
      finalCountReplacements = [ProductStatus.ACTIVE];
      
      if (allCategoryIds.length > 0) {
        const placeholders = allCategoryIds.map(() => '?').join(',');
        finalCountQuery += ` AND p.categoryId IN (${placeholders})`;
        finalCountReplacements.push(...allCategoryIds);
      }
      
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        finalCountQuery += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.shortDescription LIKE ? OR c.name LIKE ?)`;
        finalCountReplacements.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (minPrice || maxPrice) {
        const priceConditions = [];
        if (minPrice) {
          priceConditions.push('pi.price >= ?');
          finalCountReplacements.push(parseFloat(minPrice as string));
        }
        if (maxPrice) {
          priceConditions.push('pi.price <= ?');
          finalCountReplacements.push(parseFloat(maxPrice as string));
        }
        finalCountQuery += ` AND (${priceConditions.join(' AND ')})`;
      }
    }
    
    const [countResult] = await sequelize.query(finalCountQuery, { replacements: finalCountReplacements });
    const count = (countResult as any[])[0].count;
    const totalPages = Math.ceil(count / itemsPerPage);

    const [productsResult] = await sequelize.query(productsQuery, { replacements: productsReplacements });
    const products = Array.isArray(productsResult) ? productsResult : [];

    if (products.length === 0) {
      return res.status(200).json({
        message: 'No products found',
        data: {
          products: [],
          category: categoryInfo,
          pagination: {
            total: Number(count),
            totalPages,
            currentPage,
            itemsPerPage
          }
        }
      });
    }

    // STEP 4: Batch queries cho items và media
    const productIds = products.map((product: any) => product.id);
    const productIdPlaceholders = productIds.map(() => '?').join(',');

    // Single query cho tất cả product items
    const [productItemsResult] = await sequelize.query(
      `SELECT * FROM product_items WHERE productId IN (${productIdPlaceholders})`,
      { replacements: productIds }
    );

    // Single query cho tất cả product media
    const [productMediaResult] = await sequelize.query(
      `SELECT * FROM product_media WHERE productId IN (${productIdPlaceholders})`,
      { replacements: productIds }
    );

    // STEP 5: Create maps để group data
    const productItemsMap = new Map<number, any[]>();
    const productMediaMap = new Map<number, any[]>();

    // Group items by productId
    (productItemsResult as any[]).forEach((item: any) => {
      if (!productItemsMap.has(item.productId)) {
        productItemsMap.set(item.productId, []);
      }

      // Parse mediaIds JSON
      let mediaIds: number[] = [];
      if (item.mediaIds) {
        try {
          mediaIds = JSON.parse(item.mediaIds);
        } catch (error) {
          logger.error('Error parsing mediaIds for item', { 
            itemId: item.id, 
            mediaIds: item.mediaIds 
          });
        }
      }

      productItemsMap.get(item.productId)!.push({
        ...item,
        mediaIds
      });
    });

    // Group media by productId
    (productMediaResult as any[]).forEach((media: any) => {
      if (!productMediaMap.has(media.productId)) {
        productMediaMap.set(media.productId, []);
      }
      productMediaMap.get(media.productId)!.push(media);
    });

    // STEP 6: Assign items và media vào products
    const productsWithDetails = (products as any[]).map((product: any) => {
      const productItems = productItemsMap.get(product.id) || [];
      const productMedia = productMediaMap.get(product.id) || [];

      // Assign media to items based on mediaIds
      const itemsWithMedia = productItems.map((item: any) => {
        const itemMedia: any[] = [];
        
        if (item.mediaIds && Array.isArray(item.mediaIds)) {
          item.mediaIds.forEach((mediaId: number) => {
            const media = productMedia.find((m: any) => m.id === mediaId);
            if (media) {
              itemMedia.push({
                id: media.id,
                url: media.url,
                type: media.type,
                altText: media.altText
              });
            }
          });
        }

        return {
          ...item,
          media: itemMedia
        };
      });

      return {
        ...product,
        items: itemsWithMedia,
        media: productMedia.slice(0, 5) // Giới hạn 5 media per product
      };
    });

    logger.info('Products retrieved successfully', {
      categorySlug: slug,
      productsCount: products.length,
      totalCount: count,
      page: currentPage,
      search: search || null,
      sortBy: sanitizedSortBy,
      sortOrder: sanitizedSortOrder,
      filters: {
        minPrice: minPrice || null,
        maxPrice: maxPrice || null
      }
    });

    return res.status(200).json({
      message: 'Products retrieved successfully',
      data: {
        products: productsWithDetails,
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
    logger.error('Error retrieving products by category', { 
      slug, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new AppError(500, 'Internal server error', 'SERVER_ERROR');
  }
});