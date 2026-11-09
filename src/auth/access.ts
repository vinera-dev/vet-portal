export const DEFAULT_REDIRECT = "/chat";

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return DEFAULT_REDIRECT;
  }
  return value;
}
