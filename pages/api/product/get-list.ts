import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import { Product, ProductCategory, ProductMedia, ProductItem, ProductStatus } from '../../../model';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import { asyncHandler, AppError } from '../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  try {
    const { 
      name, 
      categoryId, 
      page = '1', 
      limit = '10', 
      minPrice, 
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status = ProductStatus.ACTIVE
    } = req.query;

    console.log('Query params:', { name, categoryId, page, limit, minPrice, maxPrice, search, sortBy, sortOrder, status });

    // Validate pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
      throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
    }

    // Tính offset cho phân trang
    const offset = (pageNumber - 1) * limitNumber;

    // Tạo điều kiện tìm kiếm cho Product
    const productWhere: any = {};
    
    // Xử lý điều kiện tìm kiếm theo status
    if (status !== 'all') {
      // Nếu status là một trong các giá trị hợp lệ của ProductStatus
      if (Object.values(ProductStatus).includes(status as any)) {
        productWhere.status = status;
      } else {
        // Mặc định lấy sản phẩm ACTIVE
        productWhere.status = ProductStatus.ACTIVE;
      }
    }
    
    // Tạo điều kiện tìm kiếm cho ProductItem
    const itemWhere: any = {};
    
    // Tạo điều kiện tìm kiếm cho ProductCategory
    const categoryWhere: any = {};

    if (name) {
      productWhere.name = { [Op.like]: `%${name}%` };
    }
    
    if (categoryId) {
      productWhere.categoryId = categoryId;
    }
    
    // Add price filter functionality
    if (minPrice || maxPrice) {
      // We need to handle price filtering in a different way since we're not including items in the main query
      // First get product items that match the price criteria
      const priceWhere: any = {};
      if (minPrice) priceWhere.price = { ...priceWhere.price, [Op.gte]: parseFloat(minPrice as string) };
      if (maxPrice) priceWhere.price = { ...priceWhere.price, [Op.lte]: parseFloat(maxPrice as string) };
      
      const matchingItems = await ProductItem.findAll({
        where: priceWhere,
        attributes: ['productId'],
        group: ['productId']
      });
      
      if (matchingItems.length > 0) {
        // If we have products with items in the price range, filter by these product IDs
        const productIdsInPriceRange = matchingItems.map(item => item.productId);
        productWhere.id = { [Op.in]: productIdsInPriceRange };
      } else {
        // If no products in the price range, return empty result early
        res.status(200).json({ 
          message: 'Products fetched successfully',
          data: [],
          pagination: {
            total: 0,
            page: pageNumber,
            limit: limitNumber,
            offset: offset,
            totalPages: 0,
            hasMore: false
          }
        });
        return;
      }
    }

    console.log('Where conditions:', { 
      productWhere, 
      categoryWhere, 
      itemWhere,
      hasProductConditions: Object.keys(productWhere).length > 0,
      hasCategoryConditions: Object.keys(categoryWhere).length > 0,
      hasItemConditions: Object.keys(itemWhere).length > 0
    });
    
    // Simplified approach - use a 2-step fetch process instead of complex inclusions
    console.log('Using simplified 2-step fetch process');

    // Add search functionality
    if (search) {
      const searchTerm = `%${search}%`;
      productWhere[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { description: { [Op.like]: searchTerm } },
        { shortDescription: { [Op.like]: searchTerm } }
      ];
      
      // We'll also need to fetch products by category name in a separate query
      // and combine the results
      if (Object.keys(productWhere).length > 1) {
        // Save the original where clause without the search condition
        const originalWhere = { ...productWhere };
        delete originalWhere[Op.or];
        
        // Find category IDs matching search term
        const matchingCategories = await ProductCategory.findAll({
          where: {
            name: { [Op.like]: searchTerm }
          },
          attributes: ['id']
        });
        
        if (matchingCategories.length > 0) {
          const categoryIds = matchingCategories.map(c => c.id);
          // Add these category IDs to the OR condition
          productWhere[Op.or].push({ 
            categoryId: { [Op.in]: categoryIds },
            ...originalWhere 
          });
        }
      }
    }
    
    // Build where condition string for SQL
    let whereConditions = [];
    if (name) {
      whereConditions.push(`p.name LIKE '%${name}%'`);
    }
    if (categoryId) {
      whereConditions.push(`p.categoryId = ${categoryId}`);
    }
    if (minPrice || maxPrice) {
      // For price filtering, we need to join with product_items
      whereConditions.push(`p.id IN (
        SELECT DISTINCT pi.productId 
        FROM product_items pi 
        WHERE ${minPrice ? `pi.price >= ${minPrice}` : '1=1'} 
        ${maxPrice ? `AND pi.price <= ${maxPrice}` : ''}
      )`);
    }
    if (search) {
      whereConditions.push(`(p.name LIKE '%${search}%' OR p.description LIKE '%${search}%')`);
    }
    
    // Thêm điều kiện status
    if (status !== 'all') {
      if (Object.values(ProductStatus).includes(status as any)) {
        whereConditions.push(`p.status = '${status}'`);
      } else {
        whereConditions.push(`p.status = '${ProductStatus.ACTIVE}'`);
      }
    }
    
    const whereClause = whereConditions.length > 0 
      ? whereConditions.join(' AND ') 
      : '1=1'; // Default to true if no conditions

    // Use a direct database query to get products with their avatar and secondary images
    const directQuery = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.shortDescription, 
        p.categoryId, 
        p.slug, 
        p.metaTitle, 
        p.metaDescription, 
        p.metaKeywords,
        p.avatarUrl,
        p.status
      FROM 
        products p
      WHERE 
        ${whereClause}
      ORDER BY 
        p.${sortBy} ${sortOrder}
      LIMIT ${limitNumber} 
      OFFSET ${offset}
    `;
    
    try {
      const [productsResult] = await sequelize.query(directQuery);
      
      console.log('Direct SQL query results type:', typeof productsResult);
      console.log('Is array?', Array.isArray(productsResult));
      console.log('Direct SQL query results:', JSON.stringify(productsResult, null, 2));
      
      // Ensure we have an array to work with
      const productsWithImages = Array.isArray(productsResult) ? productsResult : [productsResult];
      
      if (productsWithImages.length === 0) {
        res.status(200).json({ 
          message: 'Products fetched successfully',
          data: [],
          pagination: {
            total: 0,
            page: pageNumber,
            limit: limitNumber,
            offset: offset,
            totalPages: 0,
            hasMore: false
          }
        });
        return;
      }
      
      // // Handle categories
      // const categories = await ProductCategory.findAll({
      //   where: { id: { [Op.in]: productsWithImages.map((p: any) => p.categoryId).filter(Boolean) } },
      //   raw: true
      // });
      
      // const categoryMap = new Map();
      // categories.forEach(cat => categoryMap.set(cat.id, cat));
      
      // Prepare the final response
      const productsWithDetails = productsWithImages.map((product: any) => {
        return {
          ...product,
          // No need to transform avatarUrl since it's already a URL
        };
      });
      
      // Count total products for pagination
      const countResult = await sequelize.query(
        `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
        { type: QueryTypes.SELECT }
      );
      
      const total = countResult[0] ? (countResult[0] as any).total : productsWithDetails.length;
      const count = Number(total);
  
      res.status(200).json({ 
        message: 'Products fetched successfully',
        data: productsWithDetails,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          offset: offset,
          totalPages: Math.ceil(count / limitNumber),
          hasMore: pageNumber < Math.ceil(count / limitNumber)
        }
      });
    } catch (error) {
      console.error('Error with direct query:', error);
      // Fallback to simpler approach
      const { count, rows: products } = await Product.findAndCountAll({
        where: productWhere,
        order: [[sortBy as string, sortOrder as string]],
        limit: limitNumber,
        offset: offset,
        raw: true
      });
      
      res.status(200).json({ 
        message: 'Products fetched successfully (fallback)',
        data: products,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          offset: offset,
          totalPages: Math.ceil(count / limitNumber),
          hasMore: pageNumber < Math.ceil(count / limitNumber)
        }
      });
    }
  } catch (error) {
    throw error;
  }
});