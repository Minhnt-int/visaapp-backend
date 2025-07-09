import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { ProductItem, ProductItemStatus } from '../../../../model';
import { asyncHandler, AppError } from '../../../../lib/error-handler';

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { productId, status } = req.query;

  // Kiểm tra ID sản phẩm
  if (!productId) {
    throw new AppError(400, 'Missing product ID', 'VALIDATION_ERROR');
  }

  // Xây dựng điều kiện truy vấn
  const whereCondition: any = { productId };

  // Nếu có trạng thái, thêm vào điều kiện
  if (status && typeof status === 'string' && Object.values(ProductItemStatus).includes(status)) {
    whereCondition.status = status;
  }

  try {
    // Lấy danh sách ProductItem
    const productItems = await ProductItem.findAll({
      where: whereCondition,
      order: [['name', 'ASC']]
    });

    // Thêm thông tin media vào productItems
    const productIds = productItems.map(item => item.productId);
    const productMedia = await ProductItem.sequelize?.query(`
      SELECT 
        pi.*,
        pm.url as mediaUrl,
        pm.type as mediaType,
        pm.altText as mediaAltText
      FROM product_items pi
      LEFT JOIN product_media pm ON pi.mediaId = pm.id
      WHERE pi.productId IN (${productIds.join(',')})
    `);

    const productItemsWithMedia = productItems.map(item => {
      const media = productMedia?.[0]?.find((m: any) => m.productId === item.productId) as any;
      return {
        ...item.toJSON(),
        mediaUrl: media?.mediaUrl || null,
        mediaType: media?.mediaType || null,
        mediaAltText: media?.mediaAltText || null,
      };
    });

    res.status(200).json({
      message: 'Product items fetched successfully',
      data: productItemsWithMedia,
    });
  } catch (error) {
    throw error;
  }
});

export default handler;