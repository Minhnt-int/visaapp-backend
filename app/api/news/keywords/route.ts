// backend/visaapp/app/api/news/keywords/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY DANH SÁCH KEYWORDS/TAGS (GET /api/news/keywords)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getNewsKeywords`.
 * - Lấy tất cả các tags đang được sử dụng cho tin tức.
 * - Đếm số lượng bài viết (news) tương ứng với mỗi tag.
 * - Sắp xếp các tags theo số lượng bài viết giảm dần.
 *
 * Tối ưu hóa:
 * - Sử dụng một câu lệnh SQL duy nhất với `JOIN`, `GROUP BY` và `COUNT` để
 *   lấy toàn bộ dữ liệu cần thiết một cách hiệu quả.
 */
export async function GET() {
  try {
    const connection = await db.getConnection();

    const sql = `
      SELECT 
        t.name as name,
        COUNT(nt.news_id) as count
      FROM tags t
      JOIN news_tags nt ON t.id = nt.tag_id
      GROUP BY t.id, t.name
      ORDER BY count DESC, t.name ASC;
    `;

    const [rows] = await connection.execute(sql);

    connection.release();

    return NextResponse.json({
      status: 'success',
      message: 'Lấy dữ liệu keywords thành công.',
      data: rows
    });

  } catch (error) {
    console.error('API Error /api/news/keywords:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
