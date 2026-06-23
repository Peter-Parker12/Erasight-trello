import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { EnrichCompany } from "@/actions/enrich-company/schema";
import { InputType, ReturnType } from "@/actions/enrich-company/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { canAccessModule } from "@/lib/module-access";
import { getEnrichmentProvider } from "@/lib/enrichment/providers";
import {
  computeEnrichmentPatch,
  resolveOverrideMode,
} from "@/lib/enrichment/apply";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  if (!(await canAccessModule(orgId, userId, "CRM"))) {
    return { error: "You don't have access to the CRM module." };
  }

  const { id, overrideMode } = data;

  const company = await db.company.findUnique({ where: { id, orgId } });
  if (!company) {
    return { error: "Company not found." };
  }

  if (!company.domain) {
    return { error: "Company needs a domain before it can be enriched." };
  }

  const effectiveMode = resolveOverrideMode(company, overrideMode);
  const provider = getEnrichmentProvider();

  try {
    const result = await provider.enrich({
      domain: company.domain,
      companyId: company.id,
    });

    if (result.success) {
      // `result.data` is already normalized to EnrichmentPayload per the
      // provider contract — no need to re-run mapProviderPayload here.
      const patch = computeEnrichmentPatch(company, result.data, effectiveMode);

      const updated = await db.company.update({
        where: { id, orgId },
        data: {
          ...patch,
          enrichmentStatus: "SUCCESS",
          enrichmentSource: provider.key,
          enrichmentLastRunAt: new Date(),
          enrichmentRaw: result.raw as Prisma.InputJsonValue,
        },
      });

      await createAuditLog({
        entityId: updated.id,
        entityTitle: updated.name,
        entityType: ENTITY_TYPE.COMPANY,
        action: ACTION.UPDATE,
      });

      revalidatePath(`/organization/${orgId}/crm/companies`);
      revalidatePath(`/organization/${orgId}/crm/companies/${id}`);

      return { data: updated };
    }

    // Provider failure — record audit, do NOT touch business fields.
    const failed = await db.company.update({
      where: { id, orgId },
      data: {
        enrichmentStatus: result.status,
        enrichmentSource: provider.key,
        enrichmentLastRunAt: new Date(),
        enrichmentRaw: {
          error: result.error,
          status: result.status,
          at: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    await createAuditLog({
      entityId: failed.id,
      entityTitle: failed.name,
      entityType: ENTITY_TYPE.COMPANY,
      action: ACTION.UPDATE,
    });

    revalidatePath(`/organization/${orgId}/crm/companies`);
    revalidatePath(`/organization/${orgId}/crm/companies/${id}`);

    return {
      error:
        result.status === "NOT_FOUND"
          ? "Provider could not find this company."
          : result.error,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Enrichment failed unexpectedly.",
    };
  }
};

export const POST = toApiRoute(createSafeAction(EnrichCompany, handler));
