import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { MetaJson } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import cors from '../../../lib/cors';
import { runMiddleware } from '../../../lib/cors';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Áp dụng middleware CORS
  await runMiddleware(req, res, cors);

  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing meta JSON request', {
    requestId,
    method: req.method,
    url: req.url
  });

  await connectToDatabase();

  // GET: Lấy thông tin meta JSON
  if (req.method === 'GET') {
    try {
      const { pageKey } = req.query;

      // Nếu có pageKey, lấy chi tiết cho trang đó
      if (pageKey) {
        logger.debug(`Getting meta JSON data for key: ${pageKey}`, { requestId, pageKey });
        
        const metaData = await MetaJson.findOne({ 
          where: { pageKey: pageKey as string } 
        });
        
        if (!metaData) {
          logger.warn(`Meta JSON data not found for key: ${pageKey}`, { requestId, pageKey });
          return res.status(404).json({
            success: false,
            message: 'Meta JSON data not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: metaData
        });
      } 
      // Không có pageKey, lấy tất cả
      else {
        logger.debug('Getting all meta JSON data', { requestId });
        
        const allMetaData = await MetaJson.findAll();
        
        return res.status(200).json({
          success: true,
          data: allMetaData
        });
      }
    } catch (error) {
      logger.error('Error getting meta JSON data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error getting meta JSON data', 'SERVER_ERROR');
    }
  } 
  // POST: Tạo mới meta JSON
  else if (req.method === 'POST') {
    try {
      const { pageKey, metaData } = req.body;

      // Kiểm tra pageKey và metaData bắt buộc
      if (!pageKey || !metaData) {
        logger.warn('Missing required fields for meta JSON creation', {
          requestId,
          pageKey,
          hasMetaData: !!metaData
        });
        
        throw new AppError(400, 'Page key and meta data are required', 'VALIDATION_ERROR');
      }

      // Kiểm tra xem pageKey đã tồn tại chưa
      const existingMeta = await MetaJson.findOne({ where: { pageKey } });
      if (existingMeta) {
        logger.warn(`Page key "${pageKey}" already exists for meta JSON`, { requestId, pageKey });
        
        throw new AppError(400, `Page key "${pageKey}" already exists`, 'VALIDATION_ERROR');
      }

      // Tạo mới meta JSON
      const newMetaData = await MetaJson.create({
        pageKey,
        metaData
      });

      logger.info(`Created new meta JSON for "${pageKey}"`, {
        requestId,
        pageKey,
        metaId: newMetaData.id
      });

      return res.status(201).json({
        success: true,
        message: 'Meta JSON created successfully',
        data: newMetaData
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error creating meta JSON data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error creating meta JSON data', 'SERVER_ERROR');
    }
  } 
  // PUT: Cập nhật meta JSON
  else if (req.method === 'PUT') {
    try {
      const { pageKey, metaData } = req.body;

      // Kiểm tra pageKey và metaData bắt buộc
      if (!pageKey) {
        logger.warn('Missing page key for meta JSON update', { requestId });
        
        throw new AppError(400, 'Page key is required', 'VALIDATION_ERROR');
      }

      // Tìm kiếm meta JSON
      const existingMeta = await MetaJson.findOne({ where: { pageKey } });
      if (!existingMeta) {
        logger.warn(`Meta JSON with page key "${pageKey}" not found`, { 
          requestId,
          pageKey
        });
        
        throw new AppError(404, `Meta JSON with page key "${pageKey}" not found`, 'NOT_FOUND');
      }

      // Cập nhật dữ liệu
      const updateData: any = {};
      
      if (metaData !== undefined) updateData.metaData = metaData;

      // Nếu không có trường nào được cập nhật
      if (Object.keys(updateData).length === 0) {
        logger.warn('No fields to update for meta JSON', { requestId, pageKey });
        
        throw new AppError(400, 'No fields to update', 'VALIDATION_ERROR');
      }

      // Thực hiện cập nhật
      await existingMeta.update(updateData);

      logger.info(`Updated meta JSON for "${pageKey}"`, {
        requestId,
        pageKey,
        metaId: existingMeta.id,
        updatedFields: Object.keys(updateData)
      });

      return res.status(200).json({
        success: true,
        message: 'Meta JSON updated successfully',
        data: existingMeta
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error updating meta JSON data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error updating meta JSON data', 'SERVER_ERROR');
    }
  } 
  // DELETE: Xóa meta JSON
  else if (req.method === 'DELETE') {
    try {
      const { pageKey } = req.query;

      // Kiểm tra pageKey bắt buộc
      if (!pageKey) {
        logger.warn('Missing page key for meta JSON deletion', { requestId });
        
        throw new AppError(400, 'Page key is required', 'VALIDATION_ERROR');
      }

      // Tìm kiếm meta JSON
      const existingMeta = await MetaJson.findOne({ 
        where: { pageKey: pageKey as string } 
      });
      
      if (!existingMeta) {
        logger.warn(`Meta JSON with page key "${pageKey}" not found for deletion`, { 
          requestId,
          pageKey
        });
        
        throw new AppError(404, `Meta JSON with page key "${pageKey}" not found`, 'NOT_FOUND');
      }

      // Thực hiện xóa
      await existingMeta.destroy();

      logger.info(`Deleted meta JSON for "${pageKey}"`, {
        requestId,
        pageKey,
        metaId: existingMeta.id
      });

      return res.status(200).json({
        success: true,
        message: 'Meta JSON deleted successfully',
        data: { pageKey }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error deleting meta JSON data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error deleting meta JSON data', 'SERVER_ERROR');
    }
  } 
  // Phương thức không được hỗ trợ
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
    
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }
}); 