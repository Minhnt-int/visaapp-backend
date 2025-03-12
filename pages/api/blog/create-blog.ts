import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import BlogPost from '../../../model/BlogPost';
import BlogCategory from '../../../model/BlogCategory';
import moment from 'moment-timezone';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'POST') {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Error parsing form data' });
      }

      const { title, content, slug, metaTitle, metaDescription, metaKeywords, author, publishedAt, blogCategoryId } = fields;
      // Kiểm tra xem danh mục blog có tồn tại không
      const category = await BlogCategory.findByPk(Array.isArray(blogCategoryId) ? blogCategoryId[0] : blogCategoryId);
      if (!category) {
        return res.status(400).json({ message: 'Blog category not found' });
      }

      // Kiểm tra xem slug đã tồn tại chưa
      const existingPost = await BlogPost.findOne({ where: { slug } });
      if (existingPost) {
        return res.status(400).json({ message: 'Slug đã tồn tại' });
      }

      const contentStr = typeof content === 'string' ? content : ''; // Ensure content is a string

      // Tìm tất cả các đường dẫn ảnh trong nội dung
      const imageUrls = contentStr.match(/src="([^"]+)"/g) || [];

      // Tải lên từng ảnh và thay thế đường dẫn
      let updatedContent = contentStr;
      for (const imageUrl of imageUrls) {
        const localPathMatch = imageUrl.match(/src="([^"]+)"/);
        if (localPathMatch) {
          const localPath = localPathMatch[1];
          const fileName = path.basename(localPath);

          // Kiểm tra xem tệp có tồn tại không
          const filePath = path.join(process.cwd(), localPath);
          if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath);
            const formData = new FormData();
            formData.append('file', new Blob([fileData], { type: 'application/octet-stream' }), fileName);

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            const uploadResult = await uploadResponse.json();
            const newImageUrl = `/uploads/${uploadResult.fileName}`;

            // Thay thế đường dẫn ảnh trong nội dung
            updatedContent = updatedContent.replace(localPath, newImageUrl);
          }
        }
      }

      // Tạo bài viết mới
      const newBlogPost = await BlogPost.create({
        title: Array.isArray(title) ? title[0] : title || '',
        content: updatedContent,
        slug: Array.isArray(slug) ? slug[0] : slug || '',
        metaTitle: Array.isArray(metaTitle) ? metaTitle[0] : metaTitle || '',
        metaDescription: Array.isArray(metaDescription) ? metaDescription[0] : metaDescription || '',
        metaKeywords: Array.isArray(metaKeywords) ? metaKeywords[0] : (metaKeywords || ''),
        author: Array.isArray(author) ? author[0] : (author || ''),
        blogCategoryId: Array.isArray(blogCategoryId) ? parseInt(blogCategoryId[0], 10) : (blogCategoryId ? parseInt(blogCategoryId, 10) : 0),
        publishedAt: publishedAt ? moment(publishedAt).tz('Asia/Ho_Chi_Minh').toDate() : moment().tz('Asia/Ho_Chi_Minh').toDate(),
        createdAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
        updatedAt: moment().tz('Asia/Ho_Chi_Minh').toDate(),
      });

      res.status(201).json({ message: 'Blog post created successfully!', data: {...newBlogPost.toJSON(), id: newBlogPost.id} });
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}