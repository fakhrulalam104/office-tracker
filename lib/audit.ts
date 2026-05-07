import { AuditLog } from "@/models/AuditLog";

export async function logAuditEvent({
  userId,
  organizationId,
  action,
  entityType,
  entityId,
  details = {}
}: {
  userId: string;
  organizationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  await AuditLog.create({
    userId,
    organizationId: organizationId || undefined,
    action,
    entityType,
    entityId: entityId ?? "",
    details
  });
}
