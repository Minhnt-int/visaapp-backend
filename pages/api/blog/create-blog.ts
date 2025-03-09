import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import BlogPost from '../../../model/BlogPost';
import BlogCategory from '../../../model/BlogCategory';
import moment from 'moment-timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'POST') {
    try {
      const { title, content, slug, metaTitle, metaDescription, metaKeywords, author, publishedAt, blogCategoryId } = req.body;

      // Kiểm tra xem danh mục blog có tồn tại không
      const category = await BlogCategory.findByPk(blogCategoryId);
      if (!category) {
        return res.status(400).json({ message: 'Blog category not found' });
      }

      // Kiểm tra xem slug đã tồn tại chưa
      const existingPost = await BlogPost.findOne({ where: { slug } });
      if (existingPost) {
        return res.status(400).json({ message: 'Slug đã tồn tại' });
      }

      // Tạo bài viết mới
      const newBlogPost = await BlogPost.create({
        title,
        content,
        slug,
        metaTitle,
        metaDescription,
        metaKeywords,
        author,
        blogCategoryId,
        publishedAt: publishedAt ? moment(publishedAt).tz('Asia/Ho_Chi_Minh').toDate() : moment().tz('Asia/Ho_Chi_Minh').toDate(),
        createdAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
        updatedAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
      });

      res.status(201).json({ message: 'Blog post created successfully!', data: {...newBlogPost.toJSON(), id: newBlogPost.id} });
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ message: 'Error creating blog post', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}