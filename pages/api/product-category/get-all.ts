import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import ProductCategory from '../../../model/ProductCategory';
import { asyncHandler, AppError } from '../../../lib/error-handler';

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  try {
    // Lấy tất cả danh mục sản phẩm
    const categories = await ProductCategory.findAll({
      order: [
        ['name', 'ASC'],
        ['createdAt', 'DESC']
      ],
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    throw error;
  }
});

export default handler; 