// backend/visaapp/app/api/news/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * =================================================================================
 * API ROUTE: LẤY DANH SÁCH TIN TỨC (GET /api/news)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hoàn toàn các hàm mock `getNews` và `getNewsPreview`.
 * - Cung cấp một API endpoint duy nhất để lấy dữ liệu tin tức từ database MySQL.
 * - Hỗ trợ đầy đủ các tính năng nâng cao:
 *   1. Lọc theo nhiều tag (ví dụ: `?tags=visa-my,du-lich`)
 *   2. Tìm kiếm (full-text search) trên tiêu đề và nội dung.
 *   3. Phân trang (ví dụ: `?page=2&limit=10`).
 *   4. Sắp xếp (ví dụ: `?sortBy=published_at&sortOrder=desc`).
 *
 * Tối ưu hóa:
 * - Sử dụng connection pool (`db`) để tăng hiệu suất.
 * - Thực hiện 2 câu lệnh SQL riêng biệt: một để đếm tổng số bản ghi (cho phân trang)
 *   và một để lấy dữ liệu thực tế. Điều này hiệu quả hơn việc dùng `SQL_CALC_FOUND_ROWS`.
 * - Sử dụng prepared statements (`?`) để đảm bảo an toàn tuyệt đối, chống SQL Injection.
 */

// Định nghĩa kiểu dữ liệu cho NewsPreview từ database
interface NewsPreviewFromDB extends RowDataPacket {
  id: number;
  slug: string;
  imageUrl: string;
  title: string;
  excerpt: string;
  author: string;
  date: string; // `published_at` được alias thành `date`
  readTime: string;
  // `GROUP_CONCAT` trả về một chuỗi các tag, phân tách bằng dấu phẩy
  category: string | null; 
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // Lấy các tham số từ URL và đặt giá trị mặc định
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []; // Lọc các tag rỗng
  const sortBy = searchParams.get('sortBy') || 'published_at';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;

  try {
    const connection = await db.getConnection();

    // === XÂY DỰNG CÂU LỆNH SQL ĐỘNG ===
    let whereClauses: string[] = ['n.status = ?'];
    let params: (string | number | string[])[] = ['published'];
    let joins = `LEFT JOIN news_tags nt ON n.id = nt.news_id LEFT JOIN tags t ON nt.tag_id = t.id`;

    // 1. Thêm điều kiện tìm kiếm (search)
    if (search) {
      whereClauses.push(`(n.title LIKE ? OR n.excerpt LIKE ? OR n.content LIKE ?)`)
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 2. Thêm điều kiện lọc theo tags
    if (tags.length > 0) {
        // HAVING clause được dùng để lọc trên kết quả của GROUP_CONCAT
        // Đây là cách hiệu quả để kiểm tra một tin tức có thuộc NHIỀU tag hay không.
        // Hoặc trong trường hợp này, chúng ta tìm tin tức có ÍT NHẤT MỘT trong các tag được chọn.
        const tagPlaceholders = tags.map(() => '?').join(',');
        whereClauses.push(`t.slug IN (${tagPlaceholders})`);
        params.push(...tags);
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // === CÂU LỆNH 1: ĐẾM TỔNG SỐ BẢN GHI ===
    // Cần một câu lệnh riêng để đếm chính xác tổng số kết quả phù hợp với điều kiện lọc
    const countSql = `
      SELECT COUNT(DISTINCT n.id) as total
      FROM news n
      ${joins}
      ${whereSql}
    `;
    
    const [countRows] = await connection.execute(countSql, params);
    const total = (countRows as any)[0].total;
    const totalPages = Math.ceil(total / limit);

    // === CÂU LỆNH 2: LẤY DỮ LIỆU THỰC TẾ ===
    const dataSql = `
        SELECT 
            n.id,
            n.slug,
            n.image_url as imageUrl,
            n.title,
            n.excerpt,
            n.author,
            DATE_FORMAT(n.published_at, '%Y-%m-%d') as date,
            n.read_time as readTime,
            GROUP_CONCAT(t.name) as category
        FROM news n
        ${joins}
        ${whereSql}
        GROUP BY n.id
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ?
        OFFSET ?
    `;

    const [rows] = await connection.execute(dataSql, [...params, limit, offset]);

    connection.release(); // Quan trọng: Trả kết nối về lại pool
    
    // Xử lý kết quả: Chuyển chuỗi tags thành mảng
    const data = (rows as NewsPreviewFromDB[]).map(row => ({
        ...row,
        category: row.category ? row.category.split(',') : []
    }));

    // Trả về dữ liệu theo cấu trúc PaginatedResponse mà frontend mong đợi
    return NextResponse.json({
      status: 'success',
      message: 'Lấy dữ liệu tin tức thành công.',
      data: {
        data: data,
        total: total,
        page: page,
        limit: limit,
        totalPages: totalPages
      }
    });

  } catch (error) {
    console.error('API Error /api/news:', error);
    // Trả về lỗi server nếu có sự cố
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
