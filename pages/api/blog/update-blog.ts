import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import BlogPost from '../../../model/BlogPost';
import BlogCategory from '../../../model/BlogCategory';
import moment from 'moment-timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'PUT') {
    try {
      const { id, title, content, slug, metaTitle, metaDescription, metaKeywords, author, publishedAt, blogCategoryId } = req.body;

      // Tìm bài viết theo ID
      const blogPost = await BlogPost.findByPk(id);
      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      // Kiểm tra xem danh mục blog có tồn tại không
      const category = await BlogCategory.findByPk(blogCategoryId);
      if (!category) {
        return res.status(400).json({ message: 'Blog category not found' });
      }

      // Cập nhật thông tin bài viết
      blogPost.title = title || blogPost.title;
      blogPost.content = content || blogPost.content;
      blogPost.slug = slug || blogPost.slug;
      blogPost.metaTitle = metaTitle || blogPost.metaTitle;
      blogPost.metaDescription = metaDescription || blogPost.metaDescription;
      blogPost.metaKeywords = metaKeywords || blogPost.metaKeywords;
      blogPost.author = author || blogPost.author;
      blogPost.blogCategoryId = blogCategoryId || blogPost.blogCategoryId;
      blogPost.publishedAt = publishedAt ? moment(publishedAt).tz('Asia/Ho_Chi_Minh').toDate() : blogPost.publishedAt;
      blogPost.updatedAt = moment().tz('Asia/Ho_Chi_Minh').toDate();

      await blogPost.save();

      res.status(200).json({ message: 'Blog post updated successfully!', data: {...blogPost.toJSON(), id: blogPost.id} });
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: 'Error updating blog post', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}