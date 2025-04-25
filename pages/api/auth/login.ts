import { NextApiRequest, NextApiResponse } from 'next';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../model/User';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing login request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  });

  if (req.method !== 'POST') {
    logger.warn('Invalid method for login', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body;

  // Log input validation
  logger.debug('Validating login input', {
    requestId,
    email: email ? '(provided)' : '(missing)',
    password: password ? '(provided)' : '(missing)'
  });

  if (!email || !password) {
    logger.warn('Invalid login input', {
      requestId,
      missingFields: {
        email: !email,
        password: !password
      }
    });
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find user
  logger.debug('Finding user for login', {
    requestId,
    email
  });

  const startTime = Date.now();
  const user = await User.findOne({ where: { email } });

  if (!user) {
    logger.warn('Login failed - user not found', {
      requestId,
      email,
      processingTime: Date.now() - startTime
    });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Verify password
  logger.debug('Verifying password', {
    requestId,
    email: user.email
  });

  const isValid = await compare(password, user.password);

  if (!isValid) {
    logger.warn('Login failed - invalid password', {
      requestId,
      email: user.email,
      processingTime: Date.now() - startTime
    });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate JWT token
  logger.debug('Generating JWT token', {
    requestId,
    email: user.email
  });

  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logger.info('User logged in successfully', {
    requestId,
    userId: user.id,
    email: user.email,
    processingTime: Date.now() - startTime
  });

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
