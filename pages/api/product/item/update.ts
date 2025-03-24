import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import ProductItem, { ProductItemStatus } from '../../../../model/ProductItem';
import { asyncHandler, AppError } from '../../../../lib/error-handler';

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') {
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  await connectToDatabase();

  const { id, name, color, price, status } = req.body;

  // Kiểm tra ID
  if (!id) {
    throw new AppError(400, 'Missing product item ID', 'VALIDATION_ERROR');
  }

  // Kiểm tra trạng thái hợp lệ
  if (status && !Object.values(ProductItemStatus).includes(status)) {
    throw new AppError(400, 'Invalid status value', 'VALIDATION_ERROR');
  }

  // Tìm ProductItem
  const productItem = await ProductItem.findByPk(id);
  if (!productItem) {
    throw new AppError(404, 'Product item not found', 'NOT_FOUND');
  }

  // Cập nhật dữ liệu
  const updateData: any = {};
  
  if (name !== undefined) {
    updateData.name = name;
  }
  
  if (color !== undefined) {
    updateData.color = color;
  }
  
  if (price !== undefined) {
    updateData.price = price;
  }
  
  if (status !== undefined) {
    updateData.status = status;
  }

  try {
    // Cập nhật ProductItem
    await productItem.update(updateData);

    res.status(200).json({
      message: 'Product item updated successfully',
      data: await productItem.reload(),
    });
  } catch (error) {
    throw error;
  }
});

export default handler; 