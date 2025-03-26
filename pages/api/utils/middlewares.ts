import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';

// Cấu hình CORS middleware
export const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  origin: '*', // Trong môi trường production, bạn nên chỉ định domain cụ thể thay vì '*'
});

// Helper method để khởi chạy middleware
export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  middleware: Function
) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Hàm wrapper để sử dụng CORS trong API routes
export async function withCors(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors);
} 