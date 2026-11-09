import { createHmac, timingSafeEqual } from "node:crypto";

const VERSION = "v1";

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function sealSession(userId: string, sessionId: string, secret: string): string {
  const payload = `${VERSION}.${encode(userId)}.${encode(sessionId)}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function openSession(sealed: string | null, userId: string, secret: string): string | null {
  if (!sealed) {
    return null;
  }
  const parts = sealed.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    return null;
  }
  const payload = parts.slice(0, 3).join(".");
  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(parts[3]);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  if (decode(parts[1]) !== userId) {
    return null;
  }
  return decode(parts[2]);
}
