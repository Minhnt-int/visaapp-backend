import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../../../../lib/error-handler';
import logger from '../../../../lib/logger';

export const config = {
  api: {
    responseLimit: false, // Remove size limit for response
  },
};

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { filename } = req.query;
  
  // Use path.resolve to handle spaces in paths correctly
  const newUploadDir = path.resolve(process.cwd(), 'uploads');
  const oldUploadDir = path.resolve(process.cwd(), 'public', 'uploads');
  
  // Force a filesystem stat operation to bypass any caching
  const currentTime = Date.now();
  
  logger.debug('Processing request', {
    method: req.method,
    url: req.url,
    query: req.query,
    newUploadDir,
    oldUploadDir,
    timestamp: currentTime
  });

  // Validate filename
  if (!filename || typeof filename !== 'string') {
    logger.warn('Invalid filename parameter', { filename });
    return res.status(400).json({ error: 'Invalid filename' });
  }

  // Prevent directory traversal attacks
  const sanitizedFilename = path.basename(filename);
  
  // Use path.resolve to handle spaces in paths correctly
  const newFilePath = path.resolve(newUploadDir, sanitizedFilename);
  const oldFilePath = path.resolve(oldUploadDir, sanitizedFilename);
  
  // Force a fresh check of the file existence
  let newFileExists = false;
  let oldFileExists = false;
  
  try {
    newFileExists = fs.existsSync(newFilePath);
    if (newFileExists) {
      // Force a stat operation to ensure the file is fully written
      fs.statSync(newFilePath);
    }
  } catch (error) {
    newFileExists = false;
    logger.error('Error checking new file', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: newFilePath
    });
  }
  
  try {
    oldFileExists = fs.existsSync(oldFilePath);
    if (oldFileExists) {
      // Force a stat operation to ensure the file is fully written
      fs.statSync(oldFilePath);
    }
  } catch (error) {
    oldFileExists = false;
    logger.error('Error checking old file', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: oldFilePath
    });
  }
  
  logger.debug('Looking for file', { 
    sanitizedFilename, 
    newFilePath,
    oldFilePath,
    existsInNew: newFileExists,
    existsInOld: oldFileExists,
    timestamp: Date.now()
  });

  // Decide which file path to use
  let filePath = newFilePath;
  let foundFile = newFileExists;
  
  // If not found in new location, try the old location
  if (!foundFile && oldFileExists) {
    filePath = oldFilePath;
    foundFile = true;
    logger.debug('File found in old location', { oldFilePath });
  }
  
  if (!foundFile) {
    logger.warn('File not found in any location', { 
      filename: sanitizedFilename,
      newFilePath,
      oldFilePath,
      timestamp: Date.now()
    });
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    // Get file stats with fresh read from filesystem
    const stats = fs.statSync(filePath);
    logger.debug('File stats', { 
      size: stats.size,
      isFile: stats.isFile(),
      permissions: stats.mode.toString(8),
      filePath,
      timestamp: Date.now()
    });
    
    // Set appropriate headers
    res.setHeader('Content-Length', stats.size);
    const contentType = getContentType(sanitizedFilename);
    res.setHeader('Content-Type', contentType);
    
    // Disable caching to ensure fresh content
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    logger.debug('Serving file', { 
      filename: sanitizedFilename,
      contentType,
      size: stats.size,
      filePath,
      timestamp: Date.now()
    });

    // Use a fresh file read for each request
    const fileStream = fs.createReadStream(filePath, { autoClose: true });
    fileStream.on('error', (error) => {
      logger.error('Error streaming file', {
        error: error.message,
        filename: sanitizedFilename,
        filePath,
        timestamp: Date.now()
      });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      } else {
        res.end();
      }
    });
    
    fileStream.pipe(res);

  } catch (error) {
    logger.error('Error serving file', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      filename: sanitizedFilename,
      filePath,
      timestamp: Date.now()
    });
    return res.status(500).json({ error: 'Error serving file' });
  }
});

// Helper function to determine content type
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

export default handler; 