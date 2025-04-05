import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { ProductCategory } from '../../../model';
import logger from '../../../lib/logger';
import sequelize from '../../../lib/db';
import { QueryTypes } from 'sequelize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'PUT') {
    const transaction = await sequelize.transaction();
    
    try {
      const { id, name, parentId, slug, description } = req.body;
      
      logger.debug('Attempting to update category', { 
        categoryId: id, 
        updatedFields: { name, parentId, slug, description } 
      });

      // Tìm danh mục sản phẩm theo ID
      const category = await ProductCategory.findByPk(id, { transaction });
      if (!category) {
        logger.warn('Category not found during update attempt', { categoryId: id });
        await transaction.rollback();
        return res.status(404).json({ message: 'Category not found' });
      }

      // Log original values for debugging
      logger.debug('Found category to update', { 
        categoryId: id,
        originalValues: {
          name: category.name,
          parentId: category.parentId,
          slug: category.slug,
          description: category.description
        }
      });

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
      
      // Thêm updated_at cho câu query
      updateValues.push('updatedAt = NOW()');
      
      // Nếu không có trường nào được cập nhật, không cần thực hiện query
      if (updateValues.length === 1) { // Chỉ có updatedAt
        logger.warn('No fields to update provided', { categoryId: id });
        await transaction.rollback();
        return res.status(400).json({ message: 'No update fields provided' });
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
          description: updatedCategory?.description
        }
      });

      res.status(200).json({ 
        message: 'Category updated successfully!', 
        data: updatedCategory,
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      
      logger.error('Error updating category:', { 
        error: (error as any).message, 
        stack: (error as any).stack
      });
      
      res.status(500).json({ message: 'Error updating category', error: (error as any).message });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}