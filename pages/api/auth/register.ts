import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../model';
import bcrypt from 'bcryptjs';
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

  try {
    await connectToDatabase();

    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      logger.warn('Invalid registration input', {
        requestId,
        missingFields: {
          email: !email,
          password: !password,
          name: !name
        }
      });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn('Registration failed - email already registered', {
        requestId,
        email
      });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'user'
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toJSON();

    logger.info('User registered successfully', {
      requestId,
      userId: user.id,
      username: user.name,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});