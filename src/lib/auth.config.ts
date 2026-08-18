import type { NextAuthConfig } from "next-auth";

/**
 * Config NextAuth "edge-safe", utilisée UNIQUEMENT par le middleware.
 * Ne jamais y ajouter Credentials/Prisma/bcryptjs (incompatibles Edge Runtime).
 */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).role = token.role;
        (session.user as any).isActive = token.isActive;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
