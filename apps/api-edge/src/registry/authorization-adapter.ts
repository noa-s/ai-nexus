import { randomUUID } from "node:crypto";
import { authorize, type AuthorizationPolicySet } from "../auth/authorization.js";
import type { RegistryActor, RegistryAuthorization } from "./types.js";

export function createRegistryAuthorization(policySetProvider: () => AuthorizationPolicySet): RegistryAuthorization {
  return {
    authorize(actor: RegistryActor, action: string, target: string): boolean {
      const result = authorize(actor, {
        requestId: randomUUID(),
        actor: actor.principalType === "human" ? actor.subject : undefined,
        tenantId: actor.tenantId,
        workload: actor.workloadId,
        agent: actor.agentId,
        action,
        target,
        purpose: "registry",
      }, policySetProvider());
      return result.decision === "ALLOW";
    },
  };
}
