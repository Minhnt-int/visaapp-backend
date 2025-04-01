import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { User } from '../../../model';
import { withCors } from '../cors-middleware';

// Thời gian hết hạn của token
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 giờ

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret'
      ) as { id: number };

      // Lấy user từ database
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      // Tạo payload cho token mới
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      // Generate access token mới
      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'jwt_secret',
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      // Trả về token mới
      return res.status(200).json({
        message: 'Token refreshed successfully',
        accessToken,
        user: tokenPayload,
        expiresIn: 3600 // 1 giờ tính bằng giây
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Wrap handler với CORS middleware
export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  await withCors(req, res, async () => {
    await handler(req, res);
  });
} 