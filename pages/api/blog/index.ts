import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogPost, BlogCategory } from '../../../model';
import { Op } from 'sequelize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const limitNumber = Number(limit);

    const where = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { content: { [Op.like]: `%${search}%` } },
            { metaKeywords: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

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
} 