import { auth } from "@/auth";
import { applyAccess } from "@/auth/proxy-rule";

export default auth((request) => applyAccess(request));

export const config = {
  matcher: ["/chat/:path*", "/api/chat/:path*"],
};
