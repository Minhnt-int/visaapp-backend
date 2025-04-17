import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { ProductCategory } from '../../../model';
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
      const { id, name, parentId, slug, description, avatarUrl } = req.body;
      
      if (!id) {
        await transaction.rollback();
        throw new AppError(400, 'Category ID is required', 'VALIDATION_ERROR');
      }
      
      logger.debug('Attempting to update category', { 
        categoryId: id, 
        updatedFields: { name, parentId, slug, description, avatarUrl } 
      });

      // Kiểm tra danh mục tồn tại
      const existingCategory = await ProductCategory.findByPk(id);
      if (!existingCategory) {
        await transaction.rollback();
        throw new AppError(404, 'Category not found', 'NOT_FOUND');
      }

      // Xây dựng câu lệnh SQL để cập nhật trực tiếp
      const updateValues = [];
      const queryParams = [];
      
      if (name) {
        updateValues.push('name = ?');
        queryParams.push(name);
      }
      
      if (slug) {
        updateValues.push('slug = ?');
        queryParams.push(slug);
      }
      
      if (description !== undefined) {
        updateValues.push('description = ?');
        queryParams.push(description);
      }
      
      if (parentId !== undefined) {
        updateValues.push('parentId = ?');
        queryParams.push(parentId);
      }
      
      if (avatarUrl !== undefined) {
        updateValues.push('avatarUrl = ?');
        queryParams.push(avatarUrl);
      }
      
      // Thêm updated_at cho câu query
      updateValues.push('updatedAt = NOW()');
      
      // Nếu không có trường nào được cập nhật, không cần thực hiện query
      if (updateValues.length === 1) { // Chỉ có updatedAt
        logger.warn('No fields to update provided', { categoryId: id });
        await transaction.rollback();
        throw new AppError(400, 'No update fields provided', 'VALIDATION_ERROR');
      }
      
      // Thêm điều kiện where
      queryParams.push(id);
      
      // Thực hiện câu lệnh SQL trực tiếp
      const updateQuery = `UPDATE product_categories SET ${updateValues.join(', ')} WHERE id = ?`;
      logger.debug('Executing direct SQL update', { query: updateQuery, params: queryParams });
      
      await sequelize.query(updateQuery, {
        replacements: queryParams,
        type: QueryTypes.UPDATE,
        transaction
      });
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch the updated category to verify changes are saved
      const updatedCategory = await ProductCategory.findByPk(id);
      
      logger.info('Category updated successfully', { 
        categoryId: id,
        updatedValues: {
          name: updatedCategory?.name,
          parentId: updatedCategory?.parentId,
          slug: updatedCategory?.slug,
          description: updatedCategory?.description,
          avatarUrl: updatedCategory?.avatarUrl
        }
      });

      return res.status(200).json({ 
        message: 'Category updated successfully!', 
        data: updatedCategory,
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      
      logger.error('Error updating category:', { 
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