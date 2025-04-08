import { NextApiRequest, NextApiResponse } from 'next';
import { BlogCategory, Media } from '../../../model';
import { Op } from 'sequelize';
import { cors } from '../../../middleware/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get query parameters
      const { name, page = '1', limit = '10' } = req.query;
      
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
  } else if (req.method === 'PUT') {
    try {
      const { id, name, slug, avatarUrl } = req.body;

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
      if (slug && slug !== category.slug) {
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

      // Cập nhật danh mục
      const updateData: any = {};
      if (name) updateData.name = name;
      if (slug) updateData.slug = slug;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

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
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default cors(handler); 