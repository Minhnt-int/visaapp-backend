import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import User from '../../../model/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await hash(password, 10);
    const { email } = req.body;

    // Tạo người dùng mới
    const newUser = await User.create({ username, password: hashedPassword, email });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 