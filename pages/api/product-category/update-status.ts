import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { ProductCategory, ProductCategoryStatus } from '../../../model';
import logger from '../../../lib/logger';
import sequelize from '../../../lib/db';
import { QueryTypes } from 'sequelize';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import cors from '../../../lib/cors';
import { runMiddleware } from '../../../lib/cors';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Áp dụng middleware CORS
  await runMiddleware(req, res, cors);

  await connectToDatabase();

  if (req.method === 'POST') {
    const transaction = await sequelize.transaction();
    
    try {
      const { id, status } = req.body;
      
      if (!id) {
        await transaction.rollback();
        throw new AppError(400, 'Category ID is required', 'VALIDATION_ERROR');
      }
      
      if (!status) {
        await transaction.rollback();
        throw new AppError(400, 'Status is required', 'VALIDATION_ERROR');
      }
      
      // Valid status values from the enum
      const validStatusValues = Object.values(ProductCategoryStatus);
      if (!validStatusValues.includes(status)) {
        await transaction.rollback();
        throw new AppError(400, 'Invalid status value', 'VALIDATION_ERROR');
      }
      
      logger.debug('Attempting to update category status', { 
        categoryId: id,
        newStatus: status
      });

      // Kiểm tra danh mục tồn tại
      const existingCategory = await ProductCategory.findByPk(id);
      if (!existingCategory) {
        await transaction.rollback();
        throw new AppError(404, 'Category not found', 'NOT_FOUND');
      }

      // Thực hiện câu lệnh SQL trực tiếp để cập nhật status
      const updateQuery = `UPDATE product_categories SET status = ?, updatedAt = NOW() WHERE id = ?`;
      logger.debug('Executing direct SQL update for status change', { 
        query: updateQuery, 
        params: [status, id] 
      });
      
      await sequelize.query(updateQuery, {
        replacements: [status, id],
        type: QueryTypes.UPDATE,
        transaction
      });
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch the updated category to verify changes are saved
      const updatedCategory = await ProductCategory.findByPk(id);
      
      logger.info('Category status updated successfully', { 
        categoryId: id,
        newStatus: status
      });

      return res.status(200).json({ 
        message: 'Category status updated successfully!', 
        data: updatedCategory,
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      
      logger.error('Error updating category status:', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw error;
    }
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }
}); 