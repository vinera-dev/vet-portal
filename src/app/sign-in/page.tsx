import type { Metadata } from "next";
import { authState, signIn } from "@/auth";
import { safeRedirectPath } from "@/auth/access";

export const metadata: Metadata = { title: "Sign in" };

export const dynamic = "force-dynamic";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo = safeRedirectPath(Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl);

  async function signInWithGitHub() {
    "use server";
    await signIn("github", { redirectTo });
  }

  async function signInAsTestUser(formData: FormData) {
    "use server";
    await signIn("test-user", { name: String(formData.get("name") ?? ""), redirectTo });
  }

  return (
    <>
      <h1>Sign in</h1>
      <p>Sign in to chat with the clinic assistant.</p>
      {authState.githubEnabled ? (
        <form action={signInWithGitHub}>
          <button type="submit" className="button">
            Continue with GitHub
          </button>
        </form>
      ) : null}
      {authState.testModeEnabled ? (
        <form action={signInAsTestUser} className="form" aria-label="Test sign in">
          <div className="field">
            <label htmlFor="test-name">Test user name</label>
            <input id="test-name" name="name" type="text" required />
          </div>
          <button type="submit" className="button button--secondary">
            Sign in as test user
          </button>
        </form>
      ) : null}
      {!authState.githubEnabled && !authState.testModeEnabled ? (
        <p role="alert" className="alert alert--warning">
          Sign in is not configured on this server. Set GITHUB_ID and GITHUB_SECRET.
        </p>
      ) : null}
    </>
  );
}
