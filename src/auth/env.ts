export interface AuthEnv {
  githubId: string | undefined;
  githubSecret: string | undefined;
  secret: string | undefined;
  testMode: boolean;
  production: boolean;
}

const DEVELOPMENT_SECRET = "development-only-secret-do-not-use-in-production";

export function readAuthEnv(env: Record<string, string | undefined> = process.env): AuthEnv {
  const production = env.NODE_ENV === "production";
  const testMode = env.E2E_AUTH === "1";
  if (testMode && production) {
    throw new Error("E2E_AUTH must not be enabled in production");
  }
  return {
    githubId: env.GITHUB_ID || undefined,
    githubSecret: env.GITHUB_SECRET || undefined,
    secret: env.AUTH_SECRET || (production ? undefined : DEVELOPMENT_SECRET),
    testMode,
    production,
  };
}

export function githubConfigured(env: AuthEnv): boolean {
  return Boolean(env.githubId && env.githubSecret);
}
