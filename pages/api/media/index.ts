import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import sequelize from '../../../lib/db';
import { Media } from '../../../model';
import logger from '../../../lib/logger';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb',
  },
};

const uploadDir = path.resolve(process.cwd(), 'uploads');

// Đảm bảo thư mục uploads tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  
  await connectToDatabase();

  // GET - Lấy danh sách media
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '20', search, type } = req.query;
      const currentPage = parseInt(page as string, 10);
      const itemsPerPage = parseInt(limit as string, 10);
      const offset = (currentPage - 1) * itemsPerPage;

      // Build WHERE clause conditions
      let whereClause = '';
      const conditions = [];
      const queryParams: any = { limit: itemsPerPage, offset };

      if (search) {
        conditions.push("name LIKE :search");
        queryParams.search = `%${search}%`;
      }

      if (type && (type === 'image' || type === 'video')) {
        conditions.push("type = :type");
        queryParams.type = type;
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Query media list
      const results = await sequelize.query(
        `SELECT id, name, 
         CONCAT('/api/media/serve/', SUBSTRING_INDEX(url, '/', -1)) as url, 
         type, alt_text AS altText, created_at AS createdAt, updated_at AS updatedAt 
         FROM media 
         ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT :limit OFFSET :offset`,
        {
          replacements: queryParams,
          raw: true,
          nest: false,
          plain: false
        }
      );

      // Get total count for pagination
      const countResults = await sequelize.query(
        `SELECT COUNT(*) as count FROM media ${whereClause}`,
        {
          replacements: queryParams,
          raw: true,
          plain: true
        }
      );

      const count = (countResults as any).count;
      const totalPages = Math.ceil(count / itemsPerPage);

      logger.info('Media list retrieved successfully', {
        requestId,
        count,
        page: currentPage,
        totalPages,
        typeFilter: type || 'all'
      });

      return res.status(200).json({
        success: true,
        data: {
          media: results[0],
          pagination: {
            total: count,
            totalPages,
            currentPage,
            itemsPerPage
          }
        }
      });
    } catch (error) {
      logger.error('Error retrieving media list', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  // POST - Upload media
  else if (req.method === 'POST') {
    try {
      // Validate content type
      if (!req.headers['content-type']?.includes('multipart/form-data')) {
        throw new AppError(400, 'Content-Type must be multipart/form-data', 'INVALID_CONTENT_TYPE');
      }

      // Configure formidable
      const form = formidable({
        uploadDir,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        filter: ({ originalFilename, mimetype }) => {
          // Accept images and videos
          if (mimetype && (mimetype.startsWith('image/') || mimetype.startsWith('video/'))) {
            return true;
          }
          
          // Fallback: check file extension
          if (originalFilename) {
            const ext = path.extname(originalFilename).toLowerCase();
            const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.mp4', '.mov', '.avi', '.mkv', '.webm'];
            return allowedExts.includes(ext);
          }
          
          return false;
        }
      });

      // Parse form data
      const [fields, files] = await form.parse(req);
      
      const uploadedFiles = Array.isArray(files.file) ? files.file : (files.file ? [files.file] : []);

      if (uploadedFiles.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No files uploaded',
          details: 'Please select at least one file to upload'
        });
      }

      // Validate file sizes
      const maxSize = 50 * 1024 * 1024; // 50MB
      for (const file of uploadedFiles) {
        if (file.size > maxSize) {
          throw new AppError(400, `File ${file.originalFilename} is too large. Maximum size is 50MB`, 'FILE_TOO_LARGE');
        }
      }

      // Process uploaded files
      const uploadedMedia = [];
      for (const file of uploadedFiles) {
        try {
          const originalFilename = file.originalFilename || 'unnamed';
          const fileExt = path.extname(originalFilename);
          const fileName = `${uuidv4()}${fileExt}`;
          const finalPath = path.join(uploadDir, fileName);

          // Move file from temp location to final location
          fs.renameSync(file.filepath, finalPath);

          // Get alt text from form
          const altTextValue = fields.altText ? 
            (Array.isArray(fields.altText) ? fields.altText[0] : fields.altText) : '';

          // Detect file type
          let fileType = 'image'; // default
          if (file.mimetype?.startsWith('video/')) {
            fileType = 'video';
          }

          // Create media record
          const mediaRecord = await Media.create({
            name: originalFilename,
            url: `/api/media/serve/${fileName}`,
            type: fileType,
            altText: altTextValue
          });

          uploadedMedia.push(mediaRecord);
          
        } catch (error) {
          logger.error('Error processing uploaded file', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            filename: file.originalFilename
          });
          
          // Clean up failed file
          if (file.filepath && fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
          }
          throw error;
        }
      }

      logger.info('Files uploaded successfully', { 
        requestId,
        count: uploadedMedia.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
      });

      return res.status(200).json({
        success: true,
        data: uploadedMedia
      });
      
    } catch (error) {
      logger.error('Media upload error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error during upload'
      });
    }
  }
  
  // Method not allowed
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }
});