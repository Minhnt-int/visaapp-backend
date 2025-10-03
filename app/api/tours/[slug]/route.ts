// backend/visaapp/app/api/tours/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * =================================================================================
 * API ROUTE: LẤY CHI TIẾT TOUR (GET /api/tours/[slug])
 * =================================================================================
 *
 * Chức năng:
 * - Thay thế hàm mock `getTourBySlug`.
 * - Lấy toàn bộ thông tin chi tiết của một tour từ database dựa trên `slug`.
 * - Giống như dịch vụ visa, câu lệnh SQL rất đơn giản nhờ vào việc lưu trữ
 *   dữ liệu phức tạp (gallery, itinerary,...) trong cột `details` kiểu JSON.
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

    const tourSql = `
      SELECT 
          t.id, t.slug, t.name, t.country, t.duration, t.price, t.original_price as originalPrice,
          t.image, t.rating, t.review_count as reviewCount, t.is_hot as isHot, t.details,
          tc.slug as categorySlug
      FROM tours t
      LEFT JOIN tour_categories tc ON t.category_id = tc.id
      WHERE t.slug = ?;
    `;
    const [tourRows] = await connection.execute(tourSql, [slug]);
    const tour = (tourRows as any)[0];

    if (!tour) {
      connection.release();
      return NextResponse.json(
        { status: 'fail', message: 'Không tìm thấy tour.' },
        { status: 404 }
      );
    }

    // Lấy danh sách các tags liên quan
    const tagsSql = `
      SELECT t.name
      FROM tags t
      JOIN tour_tags tt ON t.id = tt.tag_id
      WHERE tt.tour_id = ?;
    `;
    const [tagRows] = await connection.execute(tagsSql, [tour.id]);
    const tags = (tagRows as any[]).map(t => t.name);

    connection.release();
    
    // Kết hợp dữ liệu từ cột `details` (JSON) và các trường khác
    const responseData = {
      ...tour.details, // Spread the JSON details first
      id: tour.id,
      slug: tour.slug,
      name: tour.name,
      country: tour.country,
      duration: tour.duration,
      price: tour.price,
      originalPrice: tour.originalPrice,
      image: tour.image,
      rating: tour.rating,
      reviewCount: tour.reviewCount,
      isHot: tour.isHot,
      categorySlug: tour.categorySlug,
      tags: tags // Thêm mảng tags đã lấy được
    };

    return NextResponse.json({
      status: 'success',
      message: 'Lấy chi tiết tour thành công.',
      data: responseData
    });

  } catch (error) {
    console.error(`API Error /api/tours/${slug}:`, error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
