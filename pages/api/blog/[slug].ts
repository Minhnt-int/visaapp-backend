import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { BlogPost, BlogCategory, BlogStatus } from '../../../model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ message: 'Blog post slug is required' });
    }

    console.log('Fetching blog post with slug:', slug);

    const blogPost = await BlogPost.findOne({
      where: { 
        slug: slug as string,
        status: BlogStatus.ACTIVE // Chỉ lấy các bài viết có trạng thái active
      },
      include: [
        {
          model: BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Increment view count
    await blogPost.increment('viewCount');

    return res.status(200).json({
      data: blogPost,
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 