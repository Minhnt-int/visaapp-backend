import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';

// Khởi tạo middleware CORS
const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  origin: (origin, callback) => {
    // Cho phép không có origin (như các API calls từ Postman)
    if (!origin) return callback(null, true);
    
    // Danh sách các origin được phép
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourfrontend.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
});

// Helper để chạy middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Middleware CORS để sử dụng trong các API routes
export async function withCors(req: NextApiRequest, res: NextApiResponse, next: () => Promise<void>) {
  await runMiddleware(req, res, cors);
  await next();
}

export default withCors; 