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
import { Op, QueryTypes } from 'sequelize';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll use formidable
  },
};

const uploadDir = path.resolve(process.cwd(), 'uploads');

// Đảm bảo thư mục uploads tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing media request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  await connectToDatabase();

  // Xử lý GET request - Lấy danh sách ảnh
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '20', search, type } = req.query;
      const currentPage = parseInt(page as string, 10);
      const itemsPerPage = parseInt(limit as string, 10);
      const offset = (currentPage - 1) * itemsPerPage;

      const where: any = {};
      if (search) {
        where.name = {
          [Op.like]: `%${search}%`
        };
      }

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

      // Use raw query to ensure consistent field names
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
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  // Xử lý POST request - Upload ảnh mới
  else if (req.method === 'POST') {
    try {
      // Kiểm tra kết nối database trước khi xử lý upload
      try {
        await sequelize.authenticate();
        logger.info('Database connection verified before upload', { requestId });
      } catch (dbError) {
        logger.error('Database connection failed before upload', {
          requestId,
          error: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
        return res.status(500).json({
          success: false,
          message: 'Database connection error, cannot upload media'
        });
      }

      const form = formidable({
        uploadDir,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        filter: ({ mimetype }) => {
          return mimetype ? mimetype.startsWith('image/') : false;
        },
      });

      const [fields, files] = await form.parse(req);
      const uploadedFiles = files.file || [];

      if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedMedia = [];
      for (const file of uploadedFiles) {
        try {
          const originalFilename = file.originalFilename || 'unnamed';
          const fileExt = path.extname(originalFilename);
          const fileName = `${uuidv4()}${fileExt}`;
          const finalPath = path.join(uploadDir, fileName);

          // Move file from temp location to final location
          fs.renameSync(file.filepath, finalPath);

          // Get alt_text from form if exists
          let altTextValue = '';
          if (fields.altText) {
            altTextValue = Array.isArray(fields.altText) ? fields.altText[0] : fields.altText;
          }

          // Create media record
          const mediaRecord = await Media.create({
            name: originalFilename,
            url: `/api/media/serve/${fileName}`,
            type: 'image',
            altText: altTextValue
          });

          uploadedMedia.push(mediaRecord);
          logger.info('Media record created', { 
            id: mediaRecord.id,
            filename: fileName 
          });
        } catch (error) {
          logger.error('Error processing uploaded file', {
            error: error instanceof Error ? error.message : 'Unknown error',
            filename: file.originalFilename
          });
          // Delete the file if database insert fails
          if (file.filepath && fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
          }
          throw error;
        }
      }

      logger.info('Files uploaded successfully', { count: uploadedMedia.length });

      res.status(200).json({
        success: true,
        data: uploadedMedia
      });
    } catch (error) {
      logger.error('Error uploading files', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  // Xử lý DELETE request - Xóa media
  else {
    logger.warn('Invalid method for media endpoint', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}); 