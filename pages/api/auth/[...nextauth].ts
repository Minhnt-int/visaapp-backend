import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User } from '../../../model';

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please enter an email and password');
          }

          // Tìm user theo email
          const user = await User.findOne({ 
            where: { email: credentials.email },
            raw: false // Đảm bảo trả về instance model, không phải plain object
          });
          
          if (!user) {
            console.log('User not found:', credentials.email);
            throw new Error('No user found with this email');
          }

          // Log user data để debug
          console.log('User found:', user.id, user.email);
          console.log('User data type:', typeof user);
          console.log('User data keys:', Object.keys(user.toJSON()));
          
          // Convert password để đảm bảo là string
          const userPassword = String(user.getDataValue('password'));
          console.log('Password exists:', !!userPassword);
          console.log('Password length:', userPassword.length);
          
          if (!userPassword) {
            console.log('No password found for user:', credentials.email);
            throw new Error('Invalid user data');
          }

          // So sánh mật khẩu
          try {
            const isValid = await bcrypt.compare(String(credentials.password), userPassword);
            console.log('Password comparison result:', isValid);
            
            if (!isValid) {
              console.log('Invalid password for user:', credentials.email);
              throw new Error('Invalid password');
            }

            // Trả về thông tin user không bao gồm password
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            };
          } catch (bcryptError) {
            console.error('Bcrypt compare error:', bcryptError);
            throw new Error('Authentication error');
          }
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as number;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Thêm cấu hình CORS cho cross-origin requests
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
};

export default NextAuth(authOptions); 