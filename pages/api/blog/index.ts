import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogPost, BlogCategory, BlogStatus } from '../../../model';
import { Op } from 'sequelize';
import { cors } from '../../../middleware/cors';

export default cors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 10, search = '', status = BlogStatus.ACTIVE } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const limitNumber = Number(limit);

      // Build where condition
      const where: any = {};
      
      // Add search condition if provided
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
          { metaKeywords: { [Op.like]: `%${search}%` } },
        ];
      }
      
      // Add status condition
      if (status !== 'all') {
        if (Object.values(BlogStatus).includes(status as any)) {
          where.status = status;
        } else {
          // Default to ACTIVE if status is invalid
          where.status = BlogStatus.ACTIVE;
        }
      }

      const { count, rows } = await BlogPost.findAndCountAll({
        where,
        include: [
          {
            model: BlogCategory,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
          },
        ],
        order: [['publishedAt', 'DESC']],
        offset,
        limit: limitNumber,
      });

      return res.status(200).json({
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: limitNumber,
          totalPages: Math.ceil(count / limitNumber),
        },
      });
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    // Soft delete - đánh dấu status là DELETED
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: 'Blog post ID is required' });
      }
      
      // Kiểm tra xem bài viết có tồn tại không
      const blogPost = await BlogPost.findByPk(id);
      
      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      // Cập nhật trạng thái thành DELETED
      await blogPost.update({ status: BlogStatus.DELETED });
      
      return res.status(200).json({
        message: 'Blog post deleted successfully (soft delete)',
        data: { id, status: BlogStatus.DELETED }
      });
    } catch (error) {
      console.error('Error soft deleting blog post:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    // Xóa vĩnh viễn bài viết
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'Blog post ID is required' });
      }
      
      // Kiểm tra xem bài viết có tồn tại không
      const blogPost = await BlogPost.findByPk(Number(id));
      
      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      // Xóa vĩnh viễn bài viết
      await blogPost.destroy();
      
      return res.status(200).json({
        message: 'Blog post permanently deleted',
        data: { id: Number(id) }
      });
    } catch (error) {
      console.error('Error permanently deleting blog post:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}) 