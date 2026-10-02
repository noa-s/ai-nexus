import { randomUUID } from "node:crypto";
import type { AuthorizationRequest, AuthorizationResult, IdentityContext } from "./types.js";

export interface Permission {
  action: string;
  target: string;
  tenantId?: string;
}

export interface RoleDefinition {
  name: string;
  permissions: Permission[];
}

export interface PolicyConstraint {
  id: string;
  version: string;
  effect: "ALLOW" | "DENY";
  action: string;
  target: string;
  tenantId?: string;
  role?: string;
  priority: number;
}

export interface AuthorizationPolicySet {
  roles: RoleDefinition[];
  policies: PolicyConstraint[];
}

const matches = (pattern: string, value: string): boolean => pattern === "*" || pattern === value;

export function authorize(
  identity: IdentityContext,
  request: AuthorizationRequest,
  policySet: AuthorizationPolicySet,
  traceId?: string,
): AuthorizationResult {
  const evaluatedAt = new Date().toISOString();
  const policyVersions = [...new Set(policySet.policies.map((policy) => `${policy.id}@${policy.version}`))];

  if (identity.tenantId !== request.tenantId) {
    return deny("TENANT_SCOPE_DENIED");
  }

  const rolePermissions = policySet.roles
    .filter((role) => identity.roles.includes(role.name))
    .flatMap((role) => role.permissions);

  const roleAllows = rolePermissions.some(
    (permission) =>
      matches(permission.action, request.action) &&
      matches(permission.target, request.target) &&
      (!permission.tenantId || permission.tenantId === request.tenantId),
  );

  const applicable = policySet.policies
    .filter(
      (policy) =>
        matches(policy.action, request.action) &&
        matches(policy.target, request.target) &&
        (!policy.tenantId || policy.tenantId === request.tenantId) &&
        (!policy.role || identity.roles.includes(policy.role)),
    )
    .sort((a, b) => b.priority - a.priority);

  const strongestDeny = applicable.find((policy) => policy.effect === "DENY");
  if (strongestDeny) return deny("POLICY_DENIED", [strongestDeny]);

  if (!roleAllows) return deny("RBAC_DENIED", applicable);

  return {
    decisionId: randomUUID(),
    decision: "ALLOW",
    reasonCode: applicable.length ? "AUTHORIZED_BY_RBAC_AND_POLICY" : "AUTHORIZED_BY_RBAC",
    requestId: request.requestId,
    policyVersions: applicable.length ? applicable.map((policy) => `${policy.id}@${policy.version}`) : policyVersions,
    evaluatedAt,
    traceId,
  };

  function deny(reasonCode: string, policies = applicable): AuthorizationResult {
    return {
      decisionId: randomUUID(),
      decision: "DENY",
      reasonCode,
      requestId: request.requestId,
      policyVersions: policies.map((policy) => `${policy.id}@${policy.version}`),
      evaluatedAt,
      traceId,
    };
  }
}
