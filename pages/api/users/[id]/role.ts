import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { User } from '../../../../model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Kiểm tra quyền admin
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      const userId = parseInt(req.query.id as string);
      const { role } = req.body;

      // Kiểm tra role hợp lệ
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Kiểm tra user tồn tại
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Không cho phép thay đổi role của chính mình
      if (user.id === session.user.id) {
        return res.status(400).json({ message: 'Cannot change your own role' });
      }

      // Cập nhật role
      await user.update({ role });

      return res.status(200).json({
        message: 'Role updated successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 