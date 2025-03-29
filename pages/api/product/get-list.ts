import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { Product, ProductCategory, ProductMedia, ProductItem } from '../../../model';
import { Op, Sequelize } from 'sequelize';
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
      sortOrder = 'DESC'
    } = req.query;

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
    
    if (minPrice || maxPrice) {
      if (minPrice) itemWhere.price = { ...itemWhere.price, [Op.gte]: parseFloat(minPrice as string) };
      if (maxPrice) itemWhere.price = { ...itemWhere.price, [Op.lte]: parseFloat(maxPrice as string) };
    }

    // Xây dựng truy vấn cơ bản
    const queryOptions: any = {
      where: productWhere,
      distinct: true,
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
        },
        {
          model: ProductItem,
          as: 'items',
          required: true,
          where: itemWhere,
        }
      ],
      order: [[sortBy as string, sortOrder as string]],
      limit: limitNumber,
      offset: offset,
    };

    // Thêm điều kiện tìm kiếm theo search nếu có
    if (search) {
      const searchTerm = `%${search}%`;
      // Ghi đè where để thêm điều kiện OR
      queryOptions.where = {
        ...queryOptions.where,
        [Op.or]: [
          { name: { [Op.like]: searchTerm } },
          // Tìm kiếm theo tên danh mục
          Sequelize.literal(`category.name LIKE '${searchTerm.replace(/'/g, "\\'")}'`)
        ]
      };
    }

    // Tìm kiếm sản phẩm
    const { count, rows: products } = await Product.findAndCountAll(queryOptions);

    // Tính tổng số trang
    const totalPages = Math.ceil(count / limitNumber);

    res.status(200).json({ 
      message: 'Products fetched successfully',
      data: products,
      pagination: {
        total: count,
        page: pageNumber,
        limit: limitNumber,
        offset: offset,
        totalPages: totalPages,
        hasMore: pageNumber < totalPages
      }
    });
  } catch (error) {
    throw error;
  }
});