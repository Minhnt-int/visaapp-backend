import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import User from '../../../model/User';
import logger from '../../../lib/logger';
import { asyncHandler } from '../../../lib/error-handler';

export default asyncHandler(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  logger.info('Processing registration request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'POST') {
    logger.warn('Invalid method for registration', {
      requestId,
      method: req.method
    });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, password, email } = req.body;

  // Log input validation
  logger.debug('Validating registration input', {
    requestId,
    username,
    hasEmail: !!email
  });

  if (!username || !password) {
    logger.warn('Invalid registration input', {
      requestId,
      missingFields: {
        username: !username,
        password: !password
      }
    });
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Check for existing user
  logger.debug('Checking for existing user', {
    requestId,
    username
  });
  const existingUser = await User.findOne({ where: { username } });
  
  if (existingUser) {
    logger.warn('Registration failed - user exists', {
      requestId,
      username
    });
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  logger.debug('Hashing password', { requestId });
  const hashedPassword = await hash(password, 10);

  // Create new user
  logger.debug('Creating new user', {
    requestId,
    username,
    hasEmail: !!email
  });
  
  const startTime = Date.now();
  const newUser = await User.create({ 
    username, 
    password: hashedPassword,
    email 
  });
  
  logger.info('User registered successfully', {
    requestId,
    userId: newUser.id,
    username: newUser.username,
    processingTime: Date.now() - startTime
  });

  res.status(201).json({ 
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    }
  });
});