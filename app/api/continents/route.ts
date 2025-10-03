// backend/visaapp/app/api/continents/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY DANH SÁCH CHÂU LỤC (GET /api/continents)
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getVisaContinentsPreview`.
 * - Truy vấn database để lấy danh sách tất cả các châu lục.
 * - Với mỗi châu lục, lấy luôn danh sách các quốc gia (dịch vụ visa) thuộc châu lục đó.
 */
export async function GET() {
  try {
    const connection = await db.getConnection();

    // Lấy tất cả châu lục
    const [continents] = await connection.query(`
        SELECT id, name, slug, description 
        FROM continents 
        ORDER BY name ASC;
    `);

    // Lấy tất cả dịch vụ để map vào châu lục tương ứng
    const [services] = await connection.query(`
        SELECT slug, country_name as name, continent_id 
        FROM visa_services 
        ORDER BY country_name ASC;
    `);

    connection.release();

    // Map các quốc gia vào đúng châu lục của nó
    const data = (continents as any[]).map(continent => ({
      ...continent,
      countries: (services as any[]).filter(s => s.continent_id === continent.id)
                                   .map(({name, slug}) => ({name, slug})) // Chỉ giữ lại name và slug
    }));

    return NextResponse.json({
      status: 'success',
      message: 'Lấy dữ liệu các châu lục thành công.',
      data: data
    });

  } catch (error) {
    console.error('API Error /api/continents:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
