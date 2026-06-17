import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Admin check
        const adminEmail = process.env.ADMIN_EMAIL || "khotso@tenderpilot.co.za";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return { id: "admin", email: adminEmail, name: "Khotso Sefako", isAdmin: true } as never;
        }

        // Regular subscriber
        const db = getDb();
        const subscriber = db
          .prepare("SELECT * FROM subscribers WHERE email = ?")
          .get(credentials.email) as { id: number; email: string; password_hash: string; first_name: string; last_name: string; tier: string; status: string } | undefined;

        if (!subscriber) return null;
        const valid = await bcrypt.compare(credentials.password, subscriber.password_hash);
        if (!valid) return null;

        return {
          id: String(subscriber.id),
          email: subscriber.email,
          name: `${subscriber.first_name} ${subscriber.last_name}`,
          tier: subscriber.tier,
          status: subscriber.status,
          isAdmin: false,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as never as { id: string }).id;
        token.isAdmin = (user as never as { isAdmin: boolean }).isAdmin || false;
        token.tier = (user as never as { tier: string }).tier || "scout";
        token.status = (user as never as { status: string }).status || "active";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as never as { id: string; isAdmin: boolean; tier: string; status: string }).id = token.id as string;
        (session.user as never as { id: string; isAdmin: boolean; tier: string; status: string }).isAdmin = token.isAdmin as boolean;
        (session.user as never as { id: string; isAdmin: boolean; tier: string; status: string }).tier = token.tier as string;
        (session.user as never as { id: string; isAdmin: boolean; tier: string; status: string }).status = token.status as string;
      }
      return session;
    },
  },
};
