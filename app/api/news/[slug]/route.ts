// backend/visaapp/app/api/news/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY CHI TIẾT BÀI VIẾT (GET /api/news/[slug])
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getNewsBySlug`.
 * - Lấy thông tin chi tiết của một bài viết duy nhất từ database dựa trên `slug`.
 * - Trả về đầy đủ các trường dữ liệu cần thiết để hiển thị trang chi tiết tin tức.
 *
 * Xử lý lỗi:
 * - Nếu không tìm thấy bài viết với `slug` tương ứng, API sẽ trả về lỗi 404 Not Found.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json(
      { status: 'fail', message: 'Thiếu tham số slug.' },
      { status: 400 }
    );
  }

  try {
    const connection = await db.getConnection();

    // Lấy thông tin chính của bài viết
    const newsSql = `
      SELECT 
        id, slug, title, excerpt, content, image_url as imageUrl, 
        author, DATE_FORMAT(published_at, '%Y-%m-%d') as date, read_time as readTime,
        meta_title as metaTitle, meta_description as metaDescription, 
        meta_keywords as metaKeywords, status
      FROM news 
      WHERE slug = ? AND status = 'published';
    `;
    const [newsRows] = await connection.execute(newsSql, [slug]);
    const news = (newsRows as any)[0];

    if (!news) {
      connection.release();
      return NextResponse.json(
        { status: 'fail', message: 'Không tìm thấy bài viết.' },
        { status: 404 }
      );
    }

    // Lấy danh sách các tags liên quan
    const tagsSql = `
      SELECT t.name, t.slug 
      FROM tags t
      JOIN news_tags nt ON t.id = nt.tag_id
      WHERE nt.news_id = ?;
    `;
    const [tagRows] = await connection.execute(tagsSql, [news.id]);

    connection.release();
    
    // Thêm mảng tags vào đối tượng news
    news.tags = tagRows;

    return NextResponse.json({
      status: 'success',
      message: 'Lấy chi tiết bài viết thành công.',
      data: news
    });

  } catch (error) {
    console.error(`API Error /api/news/${slug}:`, error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
