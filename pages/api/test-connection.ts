// filepath: /Users/duy/nextjs project/web-qua-tang/pages/api/test-connection.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    res.status(200).json({ message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: (error as any).message });
  }
}