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
        `SELECT id, name, url, type, alt_text AS altText, created_at AS createdAt, updated_at AS updatedAt 
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
            // Xử lý đối tượng files theo đúng cấu trúc mới của formidable v2
            const file = files.file;
            if (!file) {
              return resolve(res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
              }));
            }
            
            const uploadedMedia = [];
            const fileArray = Array.isArray(file) ? file : [file];

            for (const f of fileArray) {
              if (!f) continue;

              // Tạo tên file duy nhất
              const originalFilename = f.originalFilename || 'unnamed';
              const fileExt = path.extname(originalFilename);
              const fileName = `${uuidv4()}${fileExt}`;
              const finalPath = path.join(uploadDir, fileName);

              // Di chuyển file tạm sang thư mục chính thức
              fs.renameSync(f.filepath, finalPath);

              // Lấy alt_text từ form nếu có
              let altTextValue = '';
              if (fields.altText) {
                altTextValue = Array.isArray(fields.altText) ? fields.altText[0] : fields.altText;
              }

              // Xác định loại media (image hoặc video) dựa vào extension hoặc field type
              let mediaType = 'image'; // Mặc định là image
              
              if (fields.type) {
                // Nếu có trường type được gửi lên
                const typeValue = Array.isArray(fields.type) ? fields.type[0] : fields.type;
                if (['image', 'video'].includes(typeValue)) {
                  mediaType = typeValue;
                }
              } else {
                // Tự động xác định dựa trên extension
                const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'];
                if (videoExtensions.includes(fileExt.toLowerCase())) {
                  mediaType = 'video';
                }
              }

              // Log thông tin debug
              logger.info('Preparing to create media record', {
                requestId,
                filename: originalFilename,
                url: `/uploads/${fileName}`,
                type: mediaType,
                altText: altTextValue
              });

              try {
                // Trực tiếp gọi lệnh SQL để kiểm tra
                const insertResult = await sequelize.query(
                  `INSERT INTO media (name, url, type, alt_text, created_at, updated_at) 
                   VALUES (:name, :url, :type, :altText, NOW(), NOW())`,
                  {
                    replacements: {
                      name: originalFilename,
                      url: `/uploads/${fileName}`,
                      type: mediaType,
                      altText: altTextValue
                    },
                    type: QueryTypes.INSERT
                  }
                );
                
                const mediaId = insertResult[0];
                logger.info('Media record created with raw SQL', {
                  requestId,
                  mediaId,
                  sql: 'INSERT INTO media completed successfully'
                });
                
                // Lấy bản ghi vừa tạo
                const mediaRecord = await sequelize.query(
                  `SELECT id, name, url, type, alt_text AS altText, created_at AS createdAt, updated_at AS updatedAt 
                   FROM media WHERE id = :id`,
                  {
                    replacements: { id: mediaId },
                    type: QueryTypes.SELECT,
                    plain: true
                  }
                );
                
                uploadedMedia.push(mediaRecord);
              } catch (sqlError) {
                logger.error('SQL error creating media record', {
                  requestId,
                  error: sqlError instanceof Error ? sqlError.message : 'Unknown SQL error',
                  stack: sqlError instanceof Error ? sqlError.stack : undefined
                });
                
                // Xóa file đã upload nếu không thể tạo bản ghi
                try {
                  fs.unlinkSync(finalPath);
                  logger.info('Deleted uploaded file due to SQL error', { requestId, path: finalPath });
                } catch (unlinkError) {
                  logger.error('Failed to delete file after SQL error', {
                    requestId,
                    error: unlinkError instanceof Error ? unlinkError.message : 'Unknown error',
                    path: finalPath
                  });
                }
                
                throw sqlError;
              }
            }

            if (uploadedMedia.length === 0) {
              return resolve(res.status(400).json({
                success: false,
                message: 'No valid files were processed'
              }));
            }

            return resolve(res.status(201).json({
              success: true,
              message: 'Media uploaded successfully',
              data: uploadedMedia
            }));
          } catch (error) {
            logger.error('Error in media upload process', {
              requestId,
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
            return resolve(res.status(500).json({ 
              success: false, 
              message: 'Error uploading and saving media',
              error: error instanceof Error ? error.message : 'Unknown error'
            }));
          }
        });
      });
    } catch (outerError) {
      logger.error('Outer error in POST method', {
        requestId,
        error: outerError instanceof Error ? outerError.message : 'Unknown error',
        stack: outerError instanceof Error ? outerError.stack : undefined
      });
      return res.status(500).json({
        success: false,
        message: 'Server error during upload process',
        error: outerError instanceof Error ? outerError.message : 'Unknown error'
      });
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