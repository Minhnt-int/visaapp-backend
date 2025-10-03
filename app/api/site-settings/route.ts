// backend/visaapp/app/api/site-settings/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY CÀI ĐẶT TRANG WEB (GET /api/site-settings)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getSiteConfig`.
 * - Lấy tất cả các cài đặt từ bảng `site_settings`.
 * - Bảng này được thiết kế theo dạng key-value, với `setting_value` là một cột JSON.
 *   Điều này cho phép chúng ta lấy tất cả cài đặt chỉ bằng một câu truy vấn duy nhất
 *   và gộp chúng lại thành một object lớn.
 */
export async function GET() {
  try {
    const connection = await db.getConnection();

    const sql = `SELECT setting_key, setting_value FROM site_settings;`;
    const [rows] = await connection.execute(sql);
    connection.release();

    if (!rows || (rows as any[]).length === 0) {
        return NextResponse.json({ status: 'success', message: 'Không có cài đặt nào.', data: {} });
    }

    // Chuyển đổi kết quả từ dạng mảng [{key, value},...] thành một object lớn {key1: value1, key2: value2}
    const settings = (rows as any[]).reduce((acc, { setting_key, setting_value }) => {
      acc[setting_key] = setting_value; // setting_value đã được mysql2/promise parse từ JSON
      return acc;
    }, {});

    return NextResponse.json({
      status: 'success',
      message: 'Lấy cài đặt trang web thành công.',
      data: settings
    });

  } catch (error) {
    console.error('API Error /api/site-settings:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
