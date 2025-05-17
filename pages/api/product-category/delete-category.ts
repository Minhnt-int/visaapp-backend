import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { ProductCategory, Product } from '../../../model';
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

  if (req.method === 'DELETE') {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.query;
      
      if (!id) {
        await transaction.rollback();
        throw new AppError(400, 'Category ID is required', 'VALIDATION_ERROR');
      }
      
      logger.debug('Attempting to delete category permanently', { categoryId: id });

      // Kiểm tra danh mục tồn tại
      const existingCategory = await ProductCategory.findByPk(id as string);
      if (!existingCategory) {
        await transaction.rollback();
        throw new AppError(404, 'Category not found', 'NOT_FOUND');
      }

      // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
      const productsInCategory = await Product.findOne({
        where: { categoryId: id }
      });

      if (productsInCategory) {
        await transaction.rollback();
        throw new AppError(400, 'Cannot delete category with associated products', 'VALIDATION_ERROR');
      }

      // Kiểm tra xem có danh mục con nào không
      const childCategories = await ProductCategory.findOne({
        where: { parentId: id }
      });

      if (childCategories) {
        await transaction.rollback();
        throw new AppError(400, 'Cannot delete category with child categories', 'VALIDATION_ERROR');
      }

      // Thực hiện xóa
      await ProductCategory.destroy({
        where: { id: id },
        transaction
      });
      
      // Commit transaction
      await transaction.commit();
      
      logger.info('Category deleted permanently', { categoryId: id });

      return res.status(200).json({ 
        message: 'Category deleted successfully!',
        id: id
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      
      logger.error('Error deleting category:', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw error;
    }
  } else {
    res.setHeader('Allow', ['DELETE', 'OPTIONS']);
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }
}); 