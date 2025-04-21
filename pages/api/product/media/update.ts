import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/db';
import { ProductMedia } from '../../../../model';
import { asyncHandler, AppError } from '../../../../lib/error-handler';
import logger from '../../../../lib/logger';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }

  try {
    const { id, productId, url, type, altText } = req.body;

    if (!id) {
      throw new AppError(400, 'Media ID is required', 'VALIDATION_ERROR');
    }

    logger.debug('Updating product media', { mediaId: id, productId });

    // Kiểm tra xem media có tồn tại không
    const media = await ProductMedia.findByPk(id);
    if (!media) {
      throw new AppError(404, 'Media not found', 'NOT_FOUND_ERROR');
    }

    // Kiểm tra xem media có thuộc sản phẩm không
    if (media.productId !== productId) {
      throw new AppError(403, 'Media does not belong to this product', 'FORBIDDEN_ERROR');
    }

    // Build update object
    const updateFields: any = {};
    if (url !== undefined) updateFields.url = url;
    if (type !== undefined) updateFields.type = type;
    if (altText !== undefined) updateFields.altText = altText;

    // Cập nhật media
    await media.update(updateFields);

    logger.info('Product media updated successfully', { 
      mediaId: id, 
      productId,
      updatedFields: Object.keys(updateFields)
    });

    res.status(200).json({ 
      success: true,
      message: 'Product media updated successfully!', 
      data: media 
    });
  } catch (error) {
    logger.error('Error updating product media', { error });
    throw error;
  }
}); 