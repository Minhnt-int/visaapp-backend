import { NextApiRequest, NextApiResponse } from 'next';
import { BlogCategory } from '../../../model';
import { Op } from 'sequelize';
import { cors } from '../../../middleware/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

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
}

export default cors(handler); 