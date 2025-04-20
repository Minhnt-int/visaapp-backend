import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { MetaSEO } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import cors from '../../../lib/cors';
import { runMiddleware } from '../../../lib/cors';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Áp dụng middleware CORS
  await runMiddleware(req, res, cors);

  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing meta SEO request', {
    requestId,
    method: req.method,
    url: req.url
  });

  await connectToDatabase();

  // GET: Lấy danh sách hoặc chi tiết meta SEO
  if (req.method === 'GET') {
    try {
      const { pageKey, pageUrl } = req.query;

      // Nếu có pageKey, lấy chi tiết cho trang đó
      if (pageKey) {
        logger.debug(`Getting meta SEO data for key: ${pageKey}`, { requestId, pageKey });
        
        const metaData = await MetaSEO.findOne({ 
          where: { pageKey: pageKey as string } 
        });
        
        if (!metaData) {
          logger.warn(`Meta SEO data not found for key: ${pageKey}`, { requestId, pageKey });
          return res.status(404).json({
            success: false,
            message: 'Meta SEO data not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: metaData
        });
      }
      // Nếu có pageUrl, lấy chi tiết cho URL đó
      else if (pageUrl) {
        logger.debug(`Getting meta SEO data for URL: ${pageUrl}`, { requestId, pageUrl });
        
        const metaData = await MetaSEO.findOne({ 
          where: { pageUrl: pageUrl as string } 
        });
        
        if (!metaData) {
          logger.warn(`Meta SEO data not found for URL: ${pageUrl}`, { requestId, pageUrl });
          return res.status(404).json({
            success: false,
            message: 'Meta SEO data not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: metaData
        });
      } 
      // Không có pageKey và pageUrl, lấy tất cả
      else {
        logger.debug('Getting all meta SEO data', { requestId });
        
        const allMetaData = await MetaSEO.findAll();
        
        return res.status(200).json({
          success: true,
          data: allMetaData
        });
      }
    } catch (error) {
      logger.error('Error getting meta SEO data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error getting meta SEO data', 'SERVER_ERROR');
    }
  } 
  // POST: Tạo mới meta SEO
  else if (req.method === 'POST') {
    try {
      const {
        pageKey, pageUrl, title, description, keywords,
        ogTitle, ogDescription, ogImage, customHead, metaJson
      } = req.body;

      // Kiểm tra pageKey bắt buộc
      if (!pageKey || !title) {
        logger.warn('Missing required fields for meta SEO creation', {
          requestId,
          pageKey,
          title
        });
        
        throw new AppError(400, 'Page key and title are required', 'VALIDATION_ERROR');
      }

      // Kiểm tra xem pageKey đã tồn tại chưa
      const existingMeta = await MetaSEO.findOne({ where: { pageKey } });
      if (existingMeta) {
        logger.warn(`Page key "${pageKey}" already exists`, { requestId, pageKey });
        
        throw new AppError(400, `Page key "${pageKey}" already exists`, 'VALIDATION_ERROR');
      }

      // Tạo mới meta SEO
      const newMetaData = await MetaSEO.create({
        pageKey,
        pageUrl,
        title,
        description,
        keywords,
        ogTitle,
        ogDescription,
        ogImage,
        customHead,
      });

      logger.info(`Created new meta SEO for "${pageKey}"`, {
        requestId,
        pageKey,
        metaId: newMetaData.id
      });

      return res.status(201).json({
        success: true,
        message: 'Meta SEO created successfully',
        data: newMetaData
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error creating meta SEO data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error creating meta SEO data', 'SERVER_ERROR');
    }
  } 
  // PUT: Cập nhật meta SEO
  else if (req.method === 'PUT') {
    try {
      const {
        pageKey, pageUrl, title, description, keywords,
        ogTitle, ogDescription, ogImage, customHead, metaJson
      } = req.body;

      // Kiểm tra pageKey bắt buộc
      if (!pageKey) {
        logger.warn('Missing page key for meta SEO update', { requestId });
        
        throw new AppError(400, 'Page key is required', 'VALIDATION_ERROR');
      }

      // Tìm kiếm meta SEO
      const existingMeta = await MetaSEO.findOne({ where: { pageKey } });
      if (!existingMeta) {
        logger.warn(`Meta SEO with page key "${pageKey}" not found`, { 
          requestId,
          pageKey
        });
        
        throw new AppError(404, `Meta SEO with page key "${pageKey}" not found`, 'NOT_FOUND');
      }

      // Cập nhật dữ liệu
      const updateData: any = {};
      
      if (pageUrl !== undefined) updateData.pageUrl = pageUrl;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (keywords !== undefined) updateData.keywords = keywords;
      if (ogTitle !== undefined) updateData.ogTitle = ogTitle;
      if (ogDescription !== undefined) updateData.ogDescription = ogDescription;
      if (ogImage !== undefined) updateData.ogImage = ogImage;
      if (customHead !== undefined) updateData.customHead = customHead;
      if (metaJson !== undefined) updateData.metaJson = metaJson;

      // Nếu không có trường nào được cập nhật
      if (Object.keys(updateData).length === 0) {
        logger.warn('No fields to update', { requestId, pageKey });
        
        throw new AppError(400, 'No fields to update', 'VALIDATION_ERROR');
      }

      // Thực hiện cập nhật
      await existingMeta.update(updateData);

      logger.info(`Updated meta SEO for "${pageKey}"`, {
        requestId,
        pageKey,
        metaId: existingMeta.id,
        updatedFields: Object.keys(updateData)
      });

      return res.status(200).json({
        success: true,
        message: 'Meta SEO updated successfully',
        data: existingMeta
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error updating meta SEO data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error updating meta SEO data', 'SERVER_ERROR');
    }
  } 
  // DELETE: Xóa meta SEO
  else if (req.method === 'DELETE') {
    try {
      const { pageKey } = req.query;

      // Kiểm tra pageKey bắt buộc
      if (!pageKey) {
        logger.warn('Missing page key for meta SEO deletion', { requestId });
        
        throw new AppError(400, 'Page key is required', 'VALIDATION_ERROR');
      }

      // Tìm kiếm meta SEO
      const existingMeta = await MetaSEO.findOne({ 
        where: { pageKey: pageKey as string } 
      });
      
      if (!existingMeta) {
        logger.warn(`Meta SEO with page key "${pageKey}" not found for deletion`, { 
          requestId,
          pageKey
        });
        
        throw new AppError(404, `Meta SEO with page key "${pageKey}" not found`, 'NOT_FOUND');
      }

      // Thực hiện xóa
      await existingMeta.destroy();

      logger.info(`Deleted meta SEO for "${pageKey}"`, {
        requestId,
        pageKey,
        metaId: existingMeta.id
      });

      return res.status(200).json({
        success: true,
        message: 'Meta SEO deleted successfully',
        data: { pageKey }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error deleting meta SEO data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new AppError(500, 'Error deleting meta SEO data', 'SERVER_ERROR');
    }
  } 
  // Phương thức không được hỗ trợ
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
    
    throw new AppError(405, `Method ${req.method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  }
}); 