import { ACTION, AuditLog } from "@prisma/client";

const ENTITY_LABELS: Partial<Record<AuditLog["entityType"], string>> = {
  DEPARTMENT: "department",
  OBJECTIVE: "objective",
  KEY_RESULT: "key result",
  KPI: "KPI",
};

export const generateLogMessage = (log: AuditLog) => {
  const { action, entityTitle } = log;
  const entityType = ENTITY_LABELS[log.entityType] ?? log.entityType.toLowerCase();

  switch (action) {
    case ACTION.CREATE:
      return `created ${entityType} "${entityTitle}"`;
    case ACTION.UPDATE:
      return `updated ${entityType} "${entityTitle}"`;
    case ACTION.DELETE:
      return `deleted ${entityType} "${entityTitle}"`;
    default:
      return `unknown action ${entityType} "${entityTitle}"`;
  }
};
