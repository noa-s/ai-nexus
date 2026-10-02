import { createHmac, timingSafeEqual } from "node:crypto";
import type { IdentityContext } from "./types.js";

interface TokenPayload extends IdentityContext {
  exp: number;
}

const encode = (value: string): string => Buffer.from(value).toString("base64url");
const decode = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

const signature = (body: string, secret: string): string =>
  createHmac("sha256", secret).update(body).digest("base64url");

export function verifySignedToken(token: string, secret: string, now = Date.now()): IdentityContext | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !secret) return null;

  const [encodedPayload, encodedSignature] = parts;
  const expected = signature(encodedPayload, secret);
  const supplied = Buffer.from(encodedSignature);
  const actual = Buffer.from(expected);
  if (supplied.length !== actual.length || !timingSafeEqual(supplied, actual)) return null;

  try {
    const payload = JSON.parse(decode(encodedPayload)) as TokenPayload;
    if (!payload.subject || !payload.tenantId || !payload.principalType || !Array.isArray(payload.roles)) return null;
    if (payload.exp * 1000 <= now) return null;
    return {
      subject: payload.subject,
      principalType: payload.principalType,
      tenantId: payload.tenantId,
      roles: payload.roles,
      workloadId: payload.workloadId,
      agentId: payload.agentId,
    };
  } catch {
    return null;
  }
}

export function createSignedToken(payload: IdentityContext, secret: string, ttlSeconds = 300, now = Date.now()): string {
  if (!secret) throw new Error("AUTH_TOKEN_SECRET is required");
  const encodedPayload = encode(JSON.stringify({ ...payload, exp: Math.floor(now / 1000) + ttlSeconds }));
  return `${encodedPayload}.${signature(encodedPayload, secret)}`;
}
