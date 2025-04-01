import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../model';
import { withCors } from '../cors-middleware';

// Thời gian hết hạn của token
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 giờ
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 ngày

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Tìm user trong database
    const user = await User.findOne({ 
      where: { email },
      raw: false
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Lấy password từ user model
    const userPassword = String(user.getDataValue('password'));
    
    // So sánh password
    const isValidPassword = await bcrypt.compare(password, userPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Tạo payload cho token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    // Generate access token
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret',
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Trả về tokens
    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      expiresIn: 3600 // 1 giờ tính bằng giây
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Wrap handler với CORS middleware
export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  await withCors(req, res, async () => {
    await handler(req, res);
  });
} 