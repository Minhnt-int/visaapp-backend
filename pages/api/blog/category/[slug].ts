import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { BlogPost, BlogCategory } from '../../../../model';
import { Op } from 'sequelize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { slug } = req.query;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const limitNumber = Number(limit);

    // Find category by slug
    const category = await BlogCategory.findOne({
      where: {
        slug: slug as string
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { count, rows } = await BlogPost.findAndCountAll({
      where: {
        blogCategoryId: category.id
      },
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
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      pagination: {
        total: count,
        page: Number(page),
        limit: limitNumber,
        totalPages: Math.ceil(count / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 