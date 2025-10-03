// backend/visaapp/app/api/tours/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * =================================================================================
 * API ROUTE: LẤY DANH SÁCH TOURS (GET /api/tours)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getTours`.
 * - Cung cấp API endpoint để lấy danh sách các tour từ database.
 * - Hỗ trợ các tính năng:
 *   1. Lọc theo `categorySlug` (dưới dạng `tags` trong query. ví dụ: `?tags=tour-chau-a`)
 *   2. Tìm kiếm trên tên tour, quốc gia.
 *   3. Phân trang và sắp xếp.
 */

interface TourFromDB extends RowDataPacket {
  id: number;
  slug: string;
  name: string;
  categorySlug: string;
  country: string;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  isHot?: boolean;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  // Dùng `tags` để tương thích với frontend, nhưng ở đây nó chỉ nhận 1 giá trị categorySlug
  const categorySlug = searchParams.get('tags') || ''; 
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';

  const offset = (page - 1) * limit;

  try {
    const connection = await db.getConnection();

    // === XÂY DỰNG CÂU LỆNH SQL ĐỘNG ===
    let whereClauses: string[] = [];
    let params: (string | number)[] = [];
    let joins = `LEFT JOIN tour_categories tc ON t.category_id = tc.id`;

    // 1. Thêm điều kiện tìm kiếm
    if (search) {
      whereClauses.push(`(t.name LIKE ? OR t.country LIKE ?)`)
      params.push(`%${search}%`, `%${search}%`);
    }

    // 2. Thêm điều kiện lọc theo danh mục
    if (categorySlug) {
        whereClauses.push(`tc.slug = ?`);
        params.push(categorySlug);
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // === CÂU LỆNH 1: ĐẾM TỔNG SỐ BẢN GHI ===
    const countSql = `
      SELECT COUNT(t.id) as total
      FROM tours t
      ${joins}
      ${whereSql}
    `;
    
    const [countRows] = await connection.execute(countSql, params);
    const total = (countRows as any)[0].total;
    const totalPages = Math.ceil(total / limit);

    // === CÂU LỆNH 2: LẤY DỮ LIỆU THỰC TẾ ===
    const dataSql = `
        SELECT 
            t.id,
            t.slug,
            t.name,
            tc.slug as categorySlug,
            t.country,
            t.duration,
            t.price,
            t.original_price as originalPrice,
            t.image,
            t.rating,
            t.review_count as reviewCount,
            t.is_hot as isHot
        FROM tours t
        ${joins}
        ${whereSql}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ?
        OFFSET ?
    `;

    const [rows] = await connection.execute(dataSql, [...params, limit, offset]);

    connection.release();
    
    const data = rows as TourFromDB[];

    return NextResponse.json({
      status: 'success',
      message: 'Lấy dữ liệu tours thành công.',
      data: {
        data: data,
        total: total,
        page: page,
        limit: limit,
        totalPages: totalPages
      }
    });

  } catch (error) {
    console.error('API Error /api/tours:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
