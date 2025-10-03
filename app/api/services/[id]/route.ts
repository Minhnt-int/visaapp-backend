// backend/visaapp/app/api/services/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY CHI TIẾT DỊCH VỤ VISA (GET /api/services/[id])
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getVisaDetailById`.
 * - Lấy toàn bộ thông tin chi tiết của một dịch vụ visa từ database dựa trên `id` (slug).
 * - Vì chúng ta đã lưu trữ hầu hết thông tin phức tạp trong cột `details` (kiểu JSON),
 *   câu lệnh SQL trở nên rất đơn giản và hiệu quả.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // `id` ở đây chính là `slug`
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { status: 'fail', message: 'Thiếu tham số id.' },
      { status: 400 }
    );
  }

  try {
    const connection = await db.getConnection();

    // Truy vấn trực tiếp vào cột `details` kiểu JSON.
    // MySQL sẽ tự động parse chuỗi JSON thành object khi trả về.
    const sql = `SELECT details FROM visa_services WHERE slug = ?;`;
    
    const [rows] = await connection.execute(sql, [id]);
    const serviceDetail = (rows as any)[0]?.details;

    connection.release();

    if (!serviceDetail) {
      return NextResponse.json(
        { status: 'fail', message: 'Không tìm thấy dịch vụ.' },
        { status: 404 }
      );
    }

    // Dữ liệu trong cột `details` đã có cấu trúc chuẩn, chỉ cần trả về
    return NextResponse.json({
      status: 'success',
      message: 'Lấy chi tiết dịch vụ thành công.',
      data: serviceDetail
    });

  } catch (error) {
    console.error(`API Error /api/services/${id}:`, error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
