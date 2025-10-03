// backend/visaapp/app/api/contact/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: GỬI FORM LIÊN HỆ (POST /api/contact)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `sendContactMessage`.
 * - Nhận dữ liệu từ form liên hệ của người dùng.
 * - Lưu dữ liệu đó vào bảng `contact_submissions` trong database.
 * - Trả về thông báo thành công cho người dùng.
 */

interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: ContactPayload = await req.json();

    // Validate sơ bộ payload
    if (!payload.name || !payload.email || !payload.message) {
      return NextResponse.json(
        { status: 'fail', message: 'Tên, email, và nội dung tin nhắn là bắt buộc.' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();

    const sql = `
      INSERT INTO contact_submissions (name, email, phone, subject, message, submitted_at)
      VALUES (?, ?, ?, ?, ?, NOW());
    `;
    
    const params = [payload.name, payload.email, payload.phone, payload.subject, payload.message];

    await connection.execute(sql, params);
    connection.release();

    return NextResponse.json({
      status: 'success',
      message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
    });

  } catch (error) {
    console.error('API Error /api/contact:', error);
    // Xử lý lỗi nếu payload không phải là JSON hợp lệ
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { status: 'fail', message: 'Dữ liệu gửi lên không hợp lệ.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
