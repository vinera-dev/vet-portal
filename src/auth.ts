import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import { githubConfigured, readAuthEnv } from "@/auth/env";

const env = readAuthEnv();

const providers: Provider[] = [];

if (githubConfigured(env)) {
  providers.push(GitHub({ clientId: env.githubId, clientSecret: env.githubSecret }));
}

if (env.testMode) {
  providers.push(
    Credentials({
      id: "test-user",
      name: "Test user",
      credentials: { name: { label: "Name", type: "text" } },
      authorize: (credentials) => {
        const name = typeof credentials?.name === "string" ? credentials.name.trim() : "";
        return name ? { id: `test:${name}`, name } : null;
      },
    }),
  );
}

export const authState = {
  githubEnabled: githubConfigured(env),
  testModeEnabled: env.testMode,
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: env.secret,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/sign-in" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
