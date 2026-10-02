import { createHmac, timingSafeEqual } from "node:crypto";
import type { IdentityContext, PrincipalType } from "./types.js";

interface TokenPayload extends IdentityContext {
  exp: number;
}

const encode = (value: string): string => Buffer.from(value).toString("base64url");
const decode = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

const signature = (body: string, secret: string): string =>
  createHmac("sha256", secret).update(body).digest("base64url");

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isPrincipalType = (value: unknown): value is PrincipalType => value === "human" || value === "workload";
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => isNonEmptyString(item));

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
    if (!isNonEmptyString(payload.subject) ||
      !isNonEmptyString(payload.tenantId) ||
      !isPrincipalType(payload.principalType) ||
      !isStringArray(payload.roles)) return null;
    if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now) return null;
    if (payload.workloadId !== undefined && !isNonEmptyString(payload.workloadId)) return null;
    if (payload.agentId !== undefined && !isNonEmptyString(payload.agentId)) return null;

    const identity: IdentityContext = {
      subject: payload.subject,
      principalType: payload.principalType,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };

    if (payload.workloadId !== undefined) identity.workloadId = payload.workloadId;
    if (payload.agentId !== undefined) identity.agentId = payload.agentId;

    return identity;
  } catch {
    return null;
  }
}

export function createSignedToken(payload: IdentityContext, secret: string, ttlSeconds = 300, now = Date.now()): string {
  if (!secret) throw new Error("AUTH_TOKEN_SECRET is required");
  const encodedPayload = encode(JSON.stringify({ ...payload, exp: Math.floor(now / 1000) + ttlSeconds }));
  return `${encodedPayload}.${signature(encodedPayload, secret)}`;
}
