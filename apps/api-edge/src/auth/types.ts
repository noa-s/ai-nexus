export type PrincipalType = "human" | "workload";

export interface IdentityContext {
  subject: string;
  principalType: PrincipalType;
  tenantId: string;
  roles: string[];
  workloadId?: string;
  agentId?: string;
}

export interface AuthorizationRequest {
  requestId: string;
  actor?: string;
  tenantId: string;
  workload?: string;
  agent?: string;
  action: string;
  target: string;
  environment?: string;
  dataClassification?: string;
  policyVersions?: string[];
  purpose?: string;
}

export type AuthorizationDecision = "ALLOW" | "DENY" | "APPROVAL_REQUIRED";

export interface AuthorizationResult {
  decisionId: string;
  decision: AuthorizationDecision;
  reasonCode: string;
  requestId: string;
  tenantId: string;
  actor?: string;
  workload?: string;
  agent?: string;
  action: string;
  target: string;
  policyVersions: string[];
  evaluatedAt: string;
  traceId?: string;
}
