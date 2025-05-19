import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../../../lib/error-handler';
import logger from '../../../lib/logger';

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  const result: any = {
    cwd: process.cwd(),
    uploadDir,
    uploadDirExists: false,
    files: [],
    publicUploadDirExists: false,
    publicFiles: []
  };

  // Check uploads directory
  try {
    result.uploadDirExists = fs.existsSync(uploadDir);
    if (result.uploadDirExists) {
      const files = fs.readdirSync(uploadDir);
      result.files = files.map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          permissions: stats.mode.toString(8),
          mtime: stats.mtime
        };
      });
    }
  } catch (error) {
    logger.error('Error checking uploads directory', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      uploadDir 
    });
    result.uploadDirError = error instanceof Error ? error.message : 'Unknown error';
  }

  // Also check the old public/uploads directory
  const publicUploadDir = path.resolve(process.cwd(), 'public', 'uploads');
  try {
    result.publicUploadDirExists = fs.existsSync(publicUploadDir);
    if (result.publicUploadDirExists) {
      const files = fs.readdirSync(publicUploadDir);
      result.publicFiles = files.map(file => {
        const filePath = path.join(publicUploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          permissions: stats.mode.toString(8),
          mtime: stats.mtime
        };
      });
    }
  } catch (error) {
    logger.error('Error checking public uploads directory', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      publicUploadDir 
    });
    result.publicUploadDirError = error instanceof Error ? error.message : 'Unknown error';
  }

  // Check if the file being searched exists
  const { filename } = req.query;
  if (filename && typeof filename === 'string') {
    const filePath = path.resolve(uploadDir, filename);
    result.queryFilename = filename;
    result.queryFilePath = filePath;
    result.queryFileExists = fs.existsSync(filePath);
    
    if (result.queryFileExists) {
      const stats = fs.statSync(filePath);
      result.queryFileStats = {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        permissions: stats.mode.toString(8),
        mtime: stats.mtime
      };
    }
    
    // Also check if it exists in the old location
    const oldFilePath = path.resolve(publicUploadDir, filename);
    result.queryFileExistsInPublic = fs.existsSync(oldFilePath);
  }

  res.status(200).json(result);
});

export default handler; 