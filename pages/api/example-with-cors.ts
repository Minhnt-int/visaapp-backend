import { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from './utils/middlewares';
import { asyncHandler } from '../../lib/error-handler';

const handler = asyncHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  // Áp dụng CORS trước khi xử lý request
  await withCors(req, res);
  
  // Phần còn lại của API
  if (req.method === 'GET') {
    res.status(200).json({ message: 'API with CORS enabled' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});

export default handler; 