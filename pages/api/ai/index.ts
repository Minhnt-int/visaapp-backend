import type { NextApiRequest, NextApiResponse } from 'next';
import { asyncHandler, AppError } from '../../../lib/error-handler';
import logger from '../../../lib/logger';
import { callToGenmini } from './genAi';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing AI request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'POST') {
    logger.warn('Invalid method for AI', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const startTime = Date.now();

  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      logger.warn('Missing or invalid content parameter', { requestId });
      throw new AppError(400, 'Content is required and must be a string', 'VALIDATION_ERROR');
    }

    logger.debug('Calling AI', {
      requestId,
      contentLength: content.length
    });

    const result = await callToGenmini(content);

    logger.info('AI response received', {
      requestId,
    //   responseLength: result?.length || 0,
      processingTime: Date.now() - startTime
    });

    res.status(200).json({
      message: 'AI response generated successfully',
      data: {
        result
      }
    });

  } catch (error) {
    logger.error('Error calling AI', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
}); 