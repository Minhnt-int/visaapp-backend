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

export function verifyToken(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        req.user = decoded;
        return handler(req, res);
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}

export function verifyAdmin(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        
        if (decoded.role !== 'admin') {
          return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        
        req.user = decoded;
        return handler(req, res);
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
} 