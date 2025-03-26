import { NextApiRequest, NextApiResponse } from 'next';
import { Op, Sequelize } from 'sequelize';
import Product from '../../../model/Product';
import ProductCategory from '../../../model/ProductCategory';
import ProductMedia from '../../../model/ProductMedia';
import ProductItem from '../../../model/ProductItem';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing product list request', {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query
  });

  if (req.method !== 'GET') {
    logger.warn('Invalid method for product listing', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    page = '1',
    limit = '10',
    categoryId,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  // Log query parameters
  logger.debug('Processing product list parameters', {
    requestId,
    page,
    limit,
    categoryId,
    search,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder
  });

  // Validate and parse pagination
  const pageNumber = parseInt(page as string, 10);
  const itemsPerPage = parseInt(limit as string, 10);

  if (isNaN(pageNumber) || isNaN(itemsPerPage) || pageNumber < 1 || itemsPerPage < 1) {
    logger.warn('Invalid pagination parameters', {
      requestId,
      page,
      limit
    });
    return res.status(400).json({ message: 'Invalid pagination parameters' });
  }

  // Tính offset phân trang
  const offset = (pageNumber - 1) * itemsPerPage;

  // Build query conditions
  const where: any = {};
  const itemWhere: any = {};
  const categoryWhere: any = {};

  if (search) {
    // Tìm kiếm theo tên sản phẩm hoặc tên danh mục
    const searchTerm = `%${search}%`;
    // Không đặt where.name trực tiếp vì chúng ta sẽ sử dụng [Op.or]
    logger.debug('Added search condition for product name and category name', {
      requestId,
      searchTerm: search
    });
  }

  // Chuyển filter giá từ Product sang ProductItem
  if (minPrice || maxPrice) {
    if (minPrice) itemWhere.price = { ...itemWhere.price, [Op.gte]: parseFloat(minPrice as string) };
    if (maxPrice) itemWhere.price = { ...itemWhere.price, [Op.lte]: parseFloat(maxPrice as string) };
    logger.debug('Added price range condition for ProductItem', {
      requestId,
      minPrice,
      maxPrice
    });
  }

  // Tìm kiếm theo categoryId
  if (categoryId) {
    where.categoryId = categoryId;
    logger.debug('Added category filter', {
      requestId,
      categoryId
    });
  }

  // Start timing the query
  const startTime = Date.now();

  try {
    // Xây dựng truy vấn
    const query: any = {
      where,
      distinct: true, // Đảm bảo đếm đúng tổng số sản phẩm
      include: [
        {
          model: ProductCategory,
          as: 'category',
          required: true, // Cần thiết để tìm kiếm theo tên danh mục
          where: categoryWhere
        },
        {
          model: ProductMedia,
          as: 'media',
          required: false,
          limit: 2,
          where: {
            type: 'image'
          }
        },
        {
          model: ProductItem,
          as: 'items',
          required: true, // Yêu cầu sản phẩm phải có ít nhất một biến thể
          where: itemWhere // Áp dụng điều kiện lọc cho ProductItem (ví dụ: lọc theo giá)
        }
      ],
      order: [[sortBy as string, sortOrder as string]],
      limit: itemsPerPage,
      offset: offset
    };

    // Thêm điều kiện tìm kiếm nếu có tham số search
    if (search) {
      const searchTerm = `%${search}%`;
      query.where = {
        ...query.where,
        [Op.or]: [
          { name: { [Op.like]: searchTerm } },
          // Sử dụng Sequelize để tìm kiếm theo tên danh mục
          Sequelize.literal(`category.name LIKE '${searchTerm.replace(/'/g, "\\'")}'`)
        ]
      };
    }

    // Execute query
    const { count, rows: products } = await Product.findAndCountAll(query);

    const totalPages = Math.ceil(count / itemsPerPage);

    logger.info('Product list retrieved successfully', {
      requestId,
      totalProducts: count,
      returnedProducts: products.length,
      page: pageNumber,
      totalPages,
      processingTime: Date.now() - startTime
    });

    return res.status(200).json({
      products,
      pagination: {
        total: count,
        page: pageNumber,
        limit: itemsPerPage,
        offset: offset,
        totalPages,
        hasMore: pageNumber < totalPages
      }
    });

  } catch (error) {
    logger.error('Error retrieving product list', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    });
    throw error;
  }
});