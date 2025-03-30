import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
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
    bodyParser: false, // Disable body parsing, we'll use formidable
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

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
      const { page = '1', limit = '20', search } = req.query;
      const currentPage = parseInt(page as string, 10);
      const itemsPerPage = parseInt(limit as string, 10);
      const offset = (currentPage - 1) * itemsPerPage;

      const where: any = {};
      if (search) {
        where.name = {
          [Op.like]: `%${search}%`
        };
      }

      const { count, rows: media } = await Media.findAndCountAll({
        where,
        limit: itemsPerPage,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / itemsPerPage);

      logger.info('Media list retrieved successfully', {
        requestId,
        count,
        page: currentPage,
        totalPages
      });

      return res.status(200).json({
        success: true,
        data: {
          media,
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
    const form = formidable({
      multiples: true,
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          logger.error('Error parsing form data', {
            requestId,
            error: err.message,
            stack: err.stack
          });
          return resolve(res.status(500).json({ success: false, message: 'Error uploading file' }));
        }

        try {
          const fileArray = Array.isArray(files.file) ? files.file : [files.file];
          const uploadedMedia = [];

          for (const file of fileArray) {
            if (!file) continue;

            // Tạo tên file duy nhất
            const originalFilename = file.originalFilename || 'unnamed';
            const fileExt = path.extname(originalFilename);
            const fileName = `${uuidv4()}${fileExt}`;
            const finalPath = path.join(uploadDir, fileName);

            // Di chuyển file tạm sang thư mục chính thức
            fs.renameSync(file.filepath, finalPath);

            // Lấy alt_text từ form nếu có
            let altTextValue = '';
            if (fields.altText) {
              altTextValue = Array.isArray(fields.altText) ? fields.altText[0] : fields.altText;
            }

            console.log('Form data fields:', fields);
            console.log('Alt text value:', altTextValue);

            // Lưu thông tin vào database
            const media = await Media.create({
              name: originalFilename,
              path: `/uploads/${fileName}`,
              altText: altTextValue,
            });

            uploadedMedia.push(media);

            logger.info('Media uploaded successfully', {
              requestId,
              mediaId: media.id,
              filename: media.name,
              path: media.path
            });
          }

          return resolve(res.status(201).json({
            success: true,
            message: 'Media uploaded successfully',
            data: uploadedMedia
          }));
        } catch (error) {
          logger.error('Error creating media record', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          return resolve(res.status(500).json({ 
            success: false, 
            message: 'Error creating media record'
          }));
        }
      });
    });
  } else {
    logger.warn('Invalid method for media endpoint', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}); 