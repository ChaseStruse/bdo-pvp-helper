import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        familyName: { label: 'Family Name', type: 'text' },
        password:   { label: 'Password',    type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.familyName || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              family_name: credentials.familyName,
              password:    credentials.password,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Authentication failed');
          }

          const user = await res.json();
          return {
            id:    user.id,
            email: user.email,
            name:  user.family_name, // family_name is the display name throughout the app
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
      }
      return session;
    },
  },
};
