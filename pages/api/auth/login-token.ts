import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../model';

// Thời gian hết hạn của token
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 giờ
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 ngày

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Tìm kiếm người dùng theo email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Xác thực mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.getDataValue('password'));

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Tạo payload cho token
    const tokenPayload = {
      id: user.getDataValue('id'),
      email: user.getDataValue('email'),
      name: user.getDataValue('name'),
      role: user.getDataValue('role')
    };

    // Tạo access token
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'jwt-secret-key',
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Tạo refresh token
    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret-key',
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    const userData = {
      id: user.getDataValue('id'),
      name: user.getDataValue('name'),
      email: user.getDataValue('email'),
      role: user.getDataValue('role')
    };

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: userData,
      expiresIn: 3600 // 1 giờ tính bằng giây
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 