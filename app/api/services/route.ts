// backend/visaapp/app/api/services/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * =================================================================================
 * API ROUTE: LẤY DANH SÁCH DỊCH VỤ VISA (GET /api/services)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế các hàm mock `getServices` và `getHomepageServices`.
 * - Cung cấp API endpoint để lấy danh sách các dịch vụ visa từ database.
 * - Hỗ trợ các tính năng:
 *   1. Lọc theo `continentSlug` (dưới dạng `tags` trong query. ví dụ: `?tags=visa-chau-a`)
 *   2. Tìm kiếm trên tên dịch vụ (title), tên quốc gia, và mô tả.
 *   3. Phân trang và sắp xếp.
 */

interface VisaServiceFromDB extends RowDataPacket {
  id: string; // là slug của service
  slug: string;
  title: string;
  country: string; // country_name được alias thành country
  continentSlug: string; // slug của continent
  image: string; // hero_image được alias thành image
  description: string;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  // Dùng `tags` để tương thích với frontend, nhưng ở đây nó chỉ nhận 1 giá trị continentSlug
  const continentSlug = searchParams.get('tags') || ''; 
  const sortBy = searchParams.get('sortBy') || 'title';
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';

  const offset = (page - 1) * limit;

  try {
    const connection = await db.getConnection();

    // === XÂY DỰNG CÂU LỆNH SQL ĐỘNG ===
    let whereClauses: string[] = [];
    let params: (string | number)[] = [];
    let joins = `LEFT JOIN continents c ON vs.continent_id = c.id`;

    // 1. Thêm điều kiện tìm kiếm
    if (search) {
      whereClauses.push(`(vs.title LIKE ? OR vs.country_name LIKE ? OR vs.description LIKE ?)`)
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 2. Thêm điều kiện lọc theo châu lục
    if (continentSlug) {
        whereClauses.push(`c.slug = ?`);
        params.push(continentSlug);
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // === CÂU LỆNH 1: ĐẾM TỔNG SỐ BẢN GHI ===
    const countSql = `
      SELECT COUNT(vs.id) as total
      FROM visa_services vs
      ${joins}
      ${whereSql}
    `;
    
    const [countRows] = await connection.execute(countSql, params);
    const total = (countRows as any)[0].total;
    const totalPages = Math.ceil(total / limit);

    // === CÂU LỆNH 2: LẤY DỮ LIỆU THỰC TẾ ===
    // Các trường được alias để khớp chính xác với interface `VisaService` của frontend
    const dataSql = `
        SELECT 
            vs.slug as id, -- Frontend dùng id, ở đây ta lấy slug làm id
            vs.slug,
            vs.title,
            vs.country_name as country,
            c.slug as continentSlug,
            vs.hero_image as image,
            vs.description
        FROM visa_services vs
        ${joins}
        ${whereSql}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ?
        OFFSET ?
    `;

    const [rows] = await connection.execute(dataSql, [...params, limit, offset]);

    connection.release();
    
    const data = rows as VisaServiceFromDB[];

    return NextResponse.json({
      status: 'success',
      message: 'Lấy dữ liệu dịch vụ visa thành công.',
      data: {
        data: data,
        total: total,
        page: page,
        limit: limit,
        totalPages: totalPages
      }
    });

  } catch (error) {
    console.error('API Error /api/services:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
