// backend/visaapp/app/api/faqs/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY CÂU HỎI THƯỜNG GẶP (GET /api/faqs)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getFaqs`.
 * - Lấy danh sách các câu hỏi và câu trả lời từ bảng `faqs`.
 * - Sắp xếp chúng theo trường `display_order`.
 */
export async function GET() {
  try {
    const connection = await db.getConnection();

    const sql = `
      SELECT 
        question,
        answer
      FROM faqs
      ORDER BY display_order ASC, id ASC;
    `;

    const [rows] = await connection.execute(sql);

    connection.release();

    return NextResponse.json({
      status: 'success',
      message: 'Lấy dữ liệu FAQs thành công.',
      data: rows
    });

  } catch (error) {
    console.error('API Error /api/faqs:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
