import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function UserMenu() {
  const session = await auth();

  if (!session?.user) {
    return <Link href="/sign-in">Sign in</Link>;
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <form action={signOutAction} className="user-menu">
      <span>Signed in as {session.user.name ?? session.user.id}</span>
      <button type="submit" className="link-button">
        Sign out
      </button>
    </form>
  );
}
