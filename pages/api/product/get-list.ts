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

    // Thêm kiểm tra tính hợp lệ cho sortBy
    const validSortFields = ['id', 'name', 'createdAt', 'updatedAt', 'status', 'categoryId'];
    let sanitizedSortBy = 'createdAt';
    let needsPriceSort = false;

    // Kiểm tra xem có phải đang sort theo price không
    if (sortBy === 'price') {
      needsPriceSort = true;
      sanitizedSortBy = 'id'; // Sắp xếp tạm thời theo id, sau đó sẽ sắp xếp lại theo giá
    } else {
      sanitizedSortBy = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    }

    // Đảm bảo sortOrder hợp lệ
    const sanitizedSortOrder = (sortOrder as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Sửa câu truy vấn SQL để không sắp xếp theo price
    const directQuery = `
      SELECT 
        p.id, 
        p.name, 
        p.shortDescription, 
        p.categoryId, 
        p.slug, 
        p.avatarUrl,
        p.status,
        p.createdAt,
        p.updatedAt
      FROM 
        products p
      WHERE 
        ${whereClause}
      ORDER BY 
        p.${sanitizedSortBy} ${sanitizedSortOrder}
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
      
      // Lấy danh sách ID của tất cả sản phẩm đã tìm thấy
      const productIds = productsWithImages.map((p: any) => p.id);
      
      // Truy vấn thông tin ProductItem cho các sản phẩm
      const productItemsQuery = `
        SELECT 
          pi.*
        FROM product_items pi
        WHERE pi.productId IN (${productIds.join(',')})
      `;
      const [productItemsResult] = await sequelize.query(productItemsQuery);
      
      // Tạo map để nhóm các item theo productId
      const productItemsMap = new Map();
      Array.isArray(productItemsResult) && productItemsResult.forEach((item: any) => {
        if (!productItemsMap.has(item.productId)) {
          productItemsMap.set(item.productId, []);
        }
        productItemsMap.get(item.productId).push(item);
      });
      
      // Truy vấn thông tin Productpm cho các sản phẩm
      const productMediaQuery = `
        SELECT * FROM product_media 
        WHERE productId IN (${productIds.join(',')})
      `;
      const [productMediaResult] = await sequelize.query(productMediaQuery);
      
      // Tạo map để nhóm các media theo productId
      const productMediaMap = new Map();
      Array.isArray(productMediaResult) && productMediaResult.forEach((media: any) => {
        if (!productMediaMap.has(media.productId)) {
          productMediaMap.set(media.productId, []);
        }
        productMediaMap.get(media.productId).push(media);
      });
      
      // Prepare the final response
      let productsWithDetails = productsWithImages.map((product: any) => {
        return {
          ...product,
          items: productItemsMap.get(product.id) || [],
          media: productMediaMap.get(product.id) || [],
        };
      });
      
      // Di chuyển phần xử lý sắp xếp theo giá vào đây
      if (needsPriceSort) {
        // Lấy danh sách ID của tất cả sản phẩm
        const productIds = productsWithImages.map((p: any) => p.id);
        
        // Lấy giá nhỏ nhất của mỗi sản phẩm
        const priceQuery = `
          SELECT 
            pi.productId, 
            MIN(pi.price) as minPrice  
          FROM 
            product_items pi
          WHERE 
            pi.productId IN (${productIds.join(',')})
          GROUP BY 
            pi.productId
        `;
        
        // Lấy thông tin giá
        const [priceResults] = await sequelize.query(priceQuery);
        
        // Tạo map giá theo product ID
        const priceMap = new Map();
        Array.isArray(priceResults) && priceResults.forEach((item: any) => {
          priceMap.set(item.productId, item.minPrice);
        });
        
        // Thêm thông tin giá vào kết quả
        productsWithDetails = productsWithDetails.map((product: any) => ({
          ...product,
          price: priceMap.get(product.id) || 0
        }));
        
        // Sắp xếp kết quả theo giá
        productsWithDetails.sort((a: any, b: any) => {
          return sanitizedSortOrder === 'ASC' 
            ? a.price - b.price 
            : b.price - a.price;
        });
      }
      
      // Count total products for pagination
      const countResult = await sequelize.query(
        `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
        { type: QueryTypes.SELECT }
      );
      
      const total = countResult[0] ? (countResult[0] as any).total : productsWithDetails.length;
      const count = Number(total);

      // Sau khi lấy danh sách sản phẩm, trước khi trả về response
    
      // 1. Lấy tất cả categoryId từ sản phẩm
      interface ProductWithDetails {
        id: number;
        name: string;
        shortDescription: string;
        categoryId: number;
        slug: string;
        avatarUrl: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        items: any[];
        media: any[];
        price?: number;
      }

      const categoryIds: number[] = Array.from(new Set(productsWithDetails.map((product: ProductWithDetails) => product.categoryId)));
      
      // 2. Query tất cả categories liên quan trong một lần
      const categories = await ProductCategory.findAll({
        where: { id: categoryIds },
        attributes: ['id', 'name']
      });
      
      // 3. Tạo map để tra cứu nhanh
      const categoryMap = {} as any;
      categories.forEach(category => {
        categoryMap[category.id] = category.name;
      });
      
      // 4. Thêm categoryName vào mỗi sản phẩm
      const productsWithCategory = productsWithDetails.map(product => {
        return {
          ...product,
          categoryName: categoryMap[product.categoryId] || null
        };
      });
      
      // 5. Trả về response với sản phẩm đã bổ sung categoryName
      return res.status(200).json({
        message: "Products fetched successfully",
        data: productsWithCategory,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          offset,
          totalPages: Math.ceil(total / Number(limit)),
          hasMore: Number(page) < Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error with direct query:', error);
      // Fallback code...
      const { count, rows } = await Product.findAndCountAll({
        where: productWhere,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          model: ProductCategory,
          as: 'category', // Phải khớp với association trong model
          attributes: ['id', 'name']
        }]
      });
      
      // Chuyển đổi kết quả trước khi trả về
      const products = rows.map(product => {
        const plainProduct = product.get({ plain: true }) as any;
        
        // Thêm categoryName từ object category được join
        if (plainProduct.category) {
          plainProduct.categoryName = plainProduct.category.name;
        }
        
        return plainProduct;
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