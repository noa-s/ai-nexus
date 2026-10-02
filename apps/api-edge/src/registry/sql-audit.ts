import type { SqlExecutor } from "./sql-store.js";
import type { RegistryAuditEvent, RegistryAuditSink } from "./types.js";

export class SqlRegistryAuditSink implements RegistryAuditSink {
  constructor(private readonly query: SqlExecutor) {}

  async append(event: RegistryAuditEvent): Promise<void> {
    const target = event.version ? `${event.artifactType}:${event.artifactId}:${event.version}` : event.artifactId ? `${event.artifactType}:${event.artifactId}` : undefined;
    const lifecycleContext = event.previousLifecycleStatus && event.resultingLifecycleStatus
      ? `;lifecycle:${event.previousLifecycleStatus}->${event.resultingLifecycleStatus}`
      : "";
    await this.query(
      `INSERT INTO "authorization".event
       (event_id, event_type, principal_id, workload_id, tenant_id, action, target, resource_ref, request_id, reason_code, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        event.eventId,
        event.eventType,
        event.principalType === "human" ? event.actor : null,
        event.principalType === "workload" ? event.actor : null,
        event.tenantId,
        event.action,
        event.target,
        target ? `${target}${lifecycleContext}` : undefined,
        undefined,
        event.reasonCode,
        event.createdAt,
      ],
    );
  }
}
