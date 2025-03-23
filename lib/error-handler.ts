import { NextApiRequest, NextApiResponse } from 'next';
import logger from './logger';
import cors, { runMiddleware } from './cors'; // Import middleware CORS

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
    
    // Log error creation
    logger.debug('AppError created', {
      statusCode,
      code,
      message,
      data
    });
  }
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    data?: any;
  };
}

export const errorHandler = (
  err: Error,
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse>
) => {
  const requestInfo = {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'accept': req.headers['accept'],
      'content-type': req.headers['content-type']
    },
    clientIp: req.socket.remoteAddress
  };

  if (err instanceof AppError) {
    // Log application errors with request context
    logger.error('Application Error', {
      ...requestInfo,
      errorType: 'AppError',
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      data: err.data
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message,
        data: err.data
      }
    });
  }

  // Log unexpected errors with full context
  logger.error('Unexpected Error', {
    ...requestInfo,
    errorType: err.name || 'UnknownError',
    message: err.message,
    stack: err.stack,
    body: req.body
  });

  // Don't expose internal errors to client in production
  const clientMessage = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred'
    : err.message;

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: clientMessage
    }
  });
};

export const asyncHandler = (
  fn: (req: NextApiRequest, res: NextApiResponse) => Promise<any>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Chạy middleware CORS trước khi xử lý logic chính
      await runMiddleware(req, res, cors);

      // Xử lý yêu cầu preflight (OPTIONS)
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // Log the start of request processing
      logger.debug('Processing request', {
        method: req.method,
        url: req.url,
        query: req.query
      });

      await fn(req, res);

      // Log successful request completion if response hasn't been sent
      if (!res.writableEnded) {
        logger.debug('Request completed successfully', {
          method: req.method,
          url: req.url
        });
      }
    } catch (error) {
      errorHandler(error as Error, req, res);
    }
  };
};
