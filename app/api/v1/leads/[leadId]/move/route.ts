import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const MoveItemBody = z.object({
  id: z.string(),
  stageId: z.string(),
  order: z.number().int().optional(),
});

const MoveBody = z.object({
  items: z.array(MoveItemBody).min(1),
});

type Params = { params: Promise<{ leadId: string }> };

export const POST = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId } = await params;
  const orgId = auth.apiKey.orgId;

  // The path leadId identifies the lead whose pipeline stage is being changed;
  // body.items allows bulk updates for sibling leads dragged together in the UI.
  const lead = await db.lead.findUnique({ where: { id: leadId, orgId }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = MoveBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  // Ensure every lead and stage referenced in items belongs to this org.
  const leadIds = Array.from(new Set(parsed.data.items.map((i) => i.id)));
  const stageIds = Array.from(new Set(parsed.data.items.map((i) => i.stageId)));

  const [leads, stages] = await Promise.all([
    db.lead.findMany({ where: { id: { in: leadIds }, orgId }, select: { id: true } }),
    db.pipelineStage.findMany({ where: { id: { in: stageIds }, orgId }, select: { id: true } }),
  ]);

  const validLeadIds = new Set(leads.map((l) => l.id));
  const validStageIds = new Set(stages.map((s) => s.id));

  for (const item of parsed.data.items) {
    if (!validLeadIds.has(item.id)) {
      return NextResponse.json({ error: `Lead ${item.id} not found.` }, { status: 422 });
    }
    if (!validStageIds.has(item.stageId)) {
      return NextResponse.json({ error: `Stage ${item.stageId} not found.` }, { status: 422 });
    }
  }

  const updated = await db.$transaction(
    parsed.data.items.map((item) =>
      db.lead.update({
        where: { id: item.id },
        data: { stageId: item.stageId, ...(item.order !== undefined ? { order: item.order } : {}) },
      })
    )
  );

  return NextResponse.json({ data: updated });
};
