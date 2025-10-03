  // backend/visaapp/app/api/tours/categories/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY DANH MỤC TOUR (GET /api/tours/categories)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getTourCategories`.
 * - Lấy danh sách tất cả các danh mục tour từ database.
 * - Dữ liệu trả về sẽ không bao gồm danh sách các tour con để giữ cho API nhẹ nhàng.
 */
export async function GET() {
  try {
    const connection = await db.getConnection();

    const sql = `
      SELECT 
        name,
        slug,
        description,
        image_url as imageUrl
      FROM tour_categories
      ORDER BY name ASC;
    `;

    const [rows] = await connection.execute(sql);

    connection.release();

    return NextResponse.json({
      status: 'success',
      message: 'Lấy dữ liệu danh mục tour thành công.',
      data: rows
    });

  } catch (error) {
    console.error('API Error /api/tours/categories:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
