import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiHandler } from 'next';

type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) => Promise<void>;

// Middleware CORS cho tất cả API routes
const corsMiddleware: Middleware = async (req, res, next) => {
  // Cấu hình CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3002');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Xử lý OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Tiếp tục xử lý request
  await next();
};

// Function để bọc handler với middleware
export function withMiddleware(middleware: Middleware, handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await middleware(req, res, async () => {
      await handler(req, res);
    });
  };
}

// Xuất middleware CORS để có thể sử dụng với các API routes
export function withCors(handler: NextApiHandler): NextApiHandler {
  return withMiddleware(corsMiddleware, handler);
}

// Export mặc định là middleware CORS
export default corsMiddleware; 