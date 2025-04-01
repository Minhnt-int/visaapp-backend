import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// Interface for decoded token
interface DecodedToken {
  id: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware để xác thực token
export async function verifyToken(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) {
  try {
    // Lấy token từ Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'jwt_secret'
      ) as DecodedToken;
      
      // Thêm thông tin user vào request
      (req as any).user = decoded;
      
      // Tiếp tục xử lý request
      await next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Middleware để kiểm tra quyền admin
export async function verifyAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) {
  try {
    // Lấy thông tin user từ verifyToken middleware
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin permission required' });
    }
    
    // Tiếp tục xử lý request
    await next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 