// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import SequelizeAdapter from '@next-auth/sequelize-adapter';
import sequelize from '../../../lib/db';
import User from '../../../model/User';
import { compare } from 'bcryptjs';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials, req) => {
        // Tìm người dùng trong cơ sở dữ liệu
        const user = await User.findOne({ where: { username: credentials?.username } });
        if (user) {
          // So sánh mật khẩu
          return {
            id: user.id.toString(),
            name: user.username,
            email: user.email,
          };
        }
        return null;
      }
    }),
  ],
  adapter: SequelizeAdapter(sequelize),
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: 'YOUR_SECRET_KEY',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
});
