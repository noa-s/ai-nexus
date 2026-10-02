import { authorize, type AuthorizationPolicySet } from "./authorization.js";
import type { AuthorizationRequest, AuthorizationResult, IdentityContext } from "./types.js";

/**
 * Runtime-owned authorization boundary. Execution components must call this
 * boundary for protected actions instead of trusting an upstream API decision.
 */
export function authorizeRuntimeAction(
  identity: IdentityContext,
  request: AuthorizationRequest,
  policySet: AuthorizationPolicySet,
  traceId?: string,
): AuthorizationResult {
  return authorize(identity, request, policySet, traceId);
}
