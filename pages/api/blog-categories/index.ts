import { NextApiRequest, NextApiResponse } from 'next';
import { BlogCategory, BlogCategoryStatus } from '../../../model';
import { Op } from 'sequelize';
import { cors } from '../../../middleware/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { id, name, page = '1', limit = '10', status } = req.query;
      
      // Nếu có id, lấy chi tiết của một category
      if (id) {
        const category = await BlogCategory.findByPk(Number(id));
        
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Blog category not found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: category
        });
      }
      
      // Nếu không có id, liệt kê tất cả categories với phân trang
      // Parse pagination params
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;
      
      // Build where condition for search
      const where: any = {};
      if (name) {
        where.name = {
          [Op.like]: `%${name}%`
        };
      }

      // Thêm điều kiện lọc theo status
      if (status) {
        if (status === 'all') {
          // Không áp dụng bộ lọc status
        } else if (Object.values(BlogCategoryStatus).includes(status as any)) {
          where.status = status;
        } else {
          where.status = BlogCategoryStatus.ACTIVE; // Mặc định lọc theo active
        }
      } else {
        where.status = BlogCategoryStatus.ACTIVE; // Mặc định lọc theo active
      }

      // Get total count and paginated results
      const { count, rows } = await BlogCategory.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset,
      });

      // Return response
      return res.status(200).json({
        success: true,
        data: {
          categories: rows,
          pagination: {
            total: count,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching blog categories',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, slug, avatarUrl } = req.body;

      // Validate required fields
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: 'Name and slug are required'
        });
      }

      // Check if slug already exists
      const existingCategory = await BlogCategory.findOne({
        where: { slug }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists'
        });
      }

      // Create new category
      const newCategory = await BlogCategory.create({
        name,
        slug,
        avatarUrl,
        status: BlogCategoryStatus.ACTIVE
      });

      return res.status(201).json({
        success: true,
        message: 'Blog category created successfully',
        data: newCategory
      });
    } catch (error) {
      console.error('Error creating blog category:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating blog category',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, slug, avatarUrl, status } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Category ID is required'
        });
      }

      // Kiểm tra xem danh mục có tồn tại không
      const category = await BlogCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Blog category not found'
        });
      }

      // Nếu cập nhật slug, cần kiểm tra slug đã tồn tại chưa
      if (slug && slug !== (category as any).slug) {
        const existingCategory = await BlogCategory.findOne({
          where: {
            slug,
            id: { [Op.ne]: id } // Không phải là danh mục hiện tại
          }
        });

        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Slug already exists'
          });
        }
      }

      // Kiểm tra status có hợp lệ không
      if (status && !Object.values(BlogCategoryStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values are: ${Object.values(BlogCategoryStatus).join(', ')}`
        });
      }

      // Cập nhật danh mục
      const updateData: any = {};
      if (name) updateData.name = name;
      if (slug) updateData.slug = slug;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (status) updateData.status = status;

      await category.update(updateData);

      return res.status(200).json({
        success: true,
        message: 'Blog category updated successfully',
        data: category
      });
    } catch (error) {
      console.error('Error updating blog category:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating blog category',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Category ID is required'
        });
      }

      // Kiểm tra xem danh mục có tồn tại không
      const category = await BlogCategory.findByPk(Number(id));
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Blog category not found'
        });
      }

      // Xóa danh mục
      await category.destroy();

      return res.status(200).json({
        success: true,
        message: 'Blog category deleted successfully',
        data: { id: Number(id) }
      });
    } catch (error) {
      console.error('Error deleting blog category:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting blog category',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default cors(handler); 