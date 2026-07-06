import type { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getOrgMembers } from "@/lib/org-members";
import { buildOwnerNameGuesses } from "./match-org-member";
import { ImportCounts, ImportPreview, NameMapping, ParsedWorkbook } from "./types";

export type ImportActor = {
  userId: string;
  userName: string;
  userImage: string;
};

// Writes an audit log row directly on the transaction client. We deliberately
// avoid the shared createAuditLog() helper here: it re-fetches auth()/currentUser()
// from Clerk on every call, and doing that dozens of times while holding open a
// Postgres interactive transaction is what was blowing past the transaction
// timeout on real (multi-row) workbooks.
const logAudit = (
  tx: Prisma.TransactionClient,
  orgId: string,
  actor: ImportActor,
  entityId: string,
  entityType: ENTITY_TYPE,
  entityTitle: string,
  action: ACTION
) =>
  tx.auditLog.create({
    data: {
      orgId,
      entityId,
      entityType,
      entityTitle,
      action,
      userId: actor.userId,
      userImage: actor.userImage,
      userName: actor.userName,
    },
  });

const findDepartmentIdByName = (
  departments: { id: string; name: string }[],
  name: string
): string | undefined =>
  departments.find((d) => d.name.toLowerCase() === name.toLowerCase())?.id;

// Read-only: reports what an import *would* do without writing anything.
export const computeImportPreview = async (
  orgId: string,
  parsed: ParsedWorkbook
): Promise<ImportPreview> => {
  const members = await getOrgMembers(orgId);
  const ownerNameGuesses = buildOwnerNameGuesses(parsed.ownerNames, members);
  const unresolvedOwnerNames = parsed.ownerNames.filter((n) => !ownerNameGuesses[n]);

  const kpiEntryCount = parsed.kpis.reduce(
    (sum, k) => sum + k.monthlyEntries.filter((e) => e.target !== null || e.actual !== null).length,
    0
  );
  const keyResultCount = parsed.objectives.reduce((sum, o) => sum + o.keyResults.length, 0);

  const counts: ImportCounts = {
    departments: parsed.departmentNames.length,
    objectives: parsed.objectives.length,
    keyResults: keyResultCount,
    kpis: parsed.kpis.length,
    kpiEntries: kpiEntryCount,
  };

  return {
    counts,
    unresolvedOwnerNames,
    ownerNameGuesses,
    rowErrors: parsed.rowErrors,
  };
};

// Writes the parsed workbook into the DB. Departments/Kpis/Objectives/KeyResults
// are matched against existing rows (see plan doc for the exact keys) so a
// re-import updates in place instead of duplicating.
export const commitImport = async (
  orgId: string,
  parsed: ParsedWorkbook,
  nameMapping: NameMapping,
  actor: ImportActor,
  year: number
): Promise<ImportCounts> => {
  const resolveOwnerId = (ownerName: string) => nameMapping[ownerName] || actor.userId;

  const counts: ImportCounts = {
    departments: 0,
    objectives: 0,
    keyResults: 0,
    kpis: 0,
    kpiEntries: 0,
  };

  await db.$transaction(
    async (tx) => {
      const existingDepartments = await tx.department.findMany({
        where: { orgId },
        select: { id: true, name: true },
      });
      let departmentOrder = existingDepartments.length;
      const departments = [...existingDepartments];

      for (const name of parsed.departmentNames) {
        if (findDepartmentIdByName(departments, name)) continue;
        const department = await tx.department.create({
          data: { orgId, name, order: departmentOrder++ },
        });
        departments.push({ id: department.id, name: department.name });
        counts.departments++;
        await logAudit(tx, orgId, actor, department.id, "DEPARTMENT", department.name, "CREATE");
      }

      const objectiveOrderByGroup = new Map<string, number>();
      const nextObjectiveOrder = async (departmentId: string | null, quarter: number) => {
        const key = `${departmentId}:${quarter}`;
        if (!objectiveOrderByGroup.has(key)) {
          const existingCount = await tx.objective.count({
            where: { orgId, departmentId, year, quarter },
          });
          objectiveOrderByGroup.set(key, existingCount);
        }
        const order = objectiveOrderByGroup.get(key)!;
        objectiveOrderByGroup.set(key, order + 1);
        return order;
      };

      for (const parsedObjective of parsed.objectives) {
        const departmentId = parsedObjective.departmentName
          ? findDepartmentIdByName(departments, parsedObjective.departmentName) ?? null
          : null;
        const ownerId = resolveOwnerId(parsedObjective.ownerName);

        const existingObjective = await tx.objective.findFirst({
          where: {
            orgId,
            departmentId,
            year,
            quarter: parsedObjective.quarter,
            title: parsedObjective.title,
          },
        });

        const objective = existingObjective
          ? await tx.objective.update({
              where: { id: existingObjective.id },
              data: { ownerId },
            })
          : await tx.objective.create({
              data: {
                orgId,
                departmentId,
                title: parsedObjective.title,
                ownerId,
                quarter: parsedObjective.quarter,
                year,
                order: await nextObjectiveOrder(departmentId, parsedObjective.quarter),
              },
            });

        if (!existingObjective) {
          counts.objectives++;
          await logAudit(tx, orgId, actor, objective.id, "OBJECTIVE", objective.title, "CREATE");
        }

        let keyResultOrder = await tx.keyResult.count({ where: { objectiveId: objective.id } });

        for (const parsedKr of parsedObjective.keyResults) {
          const existingKr = await tx.keyResult.findFirst({
            where: { objectiveId: objective.id, title: parsedKr.title },
          });

          if (existingKr) {
            await tx.keyResult.update({
              where: { id: existingKr.id },
              data: {
                targetValue: parsedKr.targetValue,
                unit: parsedKr.unit,
                direction: parsedKr.direction,
              },
            });
          } else {
            const keyResult = await tx.keyResult.create({
              data: {
                objectiveId: objective.id,
                title: parsedKr.title,
                targetValue: parsedKr.targetValue,
                unit: parsedKr.unit,
                direction: parsedKr.direction,
                order: keyResultOrder++,
              },
            });
            counts.keyResults++;
            await logAudit(tx, orgId, actor, keyResult.id, "KEY_RESULT", keyResult.title, "CREATE");
          }
        }
      }

      const kpiOrderByDepartment = new Map<string, number>();
      const nextKpiOrder = async (departmentId: string | null) => {
        const key = String(departmentId);
        if (!kpiOrderByDepartment.has(key)) {
          const existingCount = await tx.kpi.count({ where: { orgId, departmentId } });
          kpiOrderByDepartment.set(key, existingCount);
        }
        const order = kpiOrderByDepartment.get(key)!;
        kpiOrderByDepartment.set(key, order + 1);
        return order;
      };

      for (const parsedKpi of parsed.kpis) {
        const departmentId = parsedKpi.departmentName
          ? findDepartmentIdByName(departments, parsedKpi.departmentName) ?? null
          : null;

        const existingKpi = await tx.kpi.findFirst({
          where: { orgId, departmentId, name: parsedKpi.name },
        });

        const kpi = existingKpi
          ? await tx.kpi.update({
              where: { id: existingKpi.id },
              data: { unit: parsedKpi.unit, direction: parsedKpi.direction },
            })
          : await tx.kpi.create({
              data: {
                orgId,
                departmentId,
                name: parsedKpi.name,
                unit: parsedKpi.unit,
                direction: parsedKpi.direction,
                order: await nextKpiOrder(departmentId),
              },
            });

        if (!existingKpi) {
          counts.kpis++;
          await logAudit(tx, orgId, actor, kpi.id, "KPI", kpi.name, "CREATE");
        }

        for (const entry of parsedKpi.monthlyEntries) {
          if (entry.target === null && entry.actual === null) continue;
          await tx.kpiEntry.upsert({
            where: { kpiId_year_month: { kpiId: kpi.id, year, month: entry.month } },
            create: {
              kpiId: kpi.id,
              year,
              month: entry.month,
              target: entry.target,
              actual: entry.actual,
            },
            update: {
              ...(entry.target !== null ? { target: entry.target } : {}),
              ...(entry.actual !== null ? { actual: entry.actual } : {}),
            },
          });
          counts.kpiEntries++;
        }
      }
    },
    { timeout: 60_000 }
  );

  return counts;
};
