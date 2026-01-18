import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface BackendTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
}

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isActive: boolean;
  preferredLocale: string | null;
}

async function refreshAccessToken(refreshToken: string): Promise<BackendTokens | null> {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const tokens = await response.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      // Access tokens typically expire in 30 minutes
      accessTokenExpires: Date.now() + 30 * 60 * 1000,
    };
  } catch {
    return null;
  }
}

async function fetchUserInfo(accessToken: string): Promise<BackendUser | null> {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin,
      isActive: user.is_active,
      preferredLocale: user.preferred_locale ?? null,
    };
  } catch {
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          // Call backend login API
          const response = await fetch(`${process.env.BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            return null;
          }

          const tokens = await response.json();

          // Fetch user info
          const user = await fetchUserInfo(tokens.access_token);
          if (!user) {
            return null;
          }

          // Return user with tokens
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
            isActive: user.isActive,
            preferredLocale: user.preferredLocale,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            accessTokenExpires: Date.now() + 30 * 60 * 1000,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          preferredLocale: user.preferredLocale,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
        };
      }

      // Return previous token if access token has not expired
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, refresh it
      const refreshedTokens = await refreshAccessToken(token.refreshToken as string);
      if (!refreshedTokens) {
        // Refresh token is invalid, user needs to sign in again
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }

      return {
        ...token,
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
        accessTokenExpires: refreshedTokens.accessTokenExpires,
      };
    },
    async session({ session, token }) {
      if (token.error) {
        // Force sign out on refresh token error
        session.error = token.error as string;
      }

      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        isAdmin: token.isAdmin as boolean,
        isActive: token.isActive as boolean,
        preferredLocale: (token.preferredLocale as string | null) ?? null,
      };

      session.accessToken = token.accessToken as string;

      return session;
    },
  },
  pages: {
    signIn: "/ja/login",
  },
  session: {
    strategy: "jwt",
  },
});
