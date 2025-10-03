// backend/visaapp/app/api/continents/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY CHI TIẾT CHÂU LỤC (GET /api/continents/[slug])
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getVisaContinentPreviewBySlug`.
 * - Lấy thông tin của một châu lục duy nhất dựa trên `slug`.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json(
      { status: 'fail', message: 'Thiếu tham số slug.' },
      { status: 400 }
    );
  }

  try {
    const connection = await db.getConnection();

    const sql = `SELECT name, slug, description FROM continents WHERE slug = ?;`;
    const [rows] = await connection.execute(sql, [slug]);
    const continent = (rows as any)[0];

    connection.release();

    if (!continent) {
      return NextResponse.json(
        { status: 'fail', message: 'Không tìm thấy châu lục.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Lấy chi tiết châu lục thành công.',
      data: continent
    });

  } catch (error) {
    console.error(`API Error /api/continents/${slug}:`, error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
