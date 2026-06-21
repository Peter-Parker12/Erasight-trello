import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Priority } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

const VALID_PRIORITIES = new Set<string>(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]);

const ImportCardsSchema = z.object({
  boardId: z.string(),
  listId: z.string(),
  rows: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.string().optional(),
      dueDate: z.string().optional(),
    })
  ).min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ImportCardsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { boardId, listId, rows } = parsed.data;

    const list = await db.list.findUnique({
      where: { id: listId, board: { orgId } },
    });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const lastCard = await db.card.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const startOrder = (lastCard?.order ?? 0) + 1;

    const cards = await db.$transaction(
      rows.map((row, i) => {
        const priority = row.priority && VALID_PRIORITIES.has(row.priority.toUpperCase())
          ? (row.priority.toUpperCase() as Priority)
          : "NONE";

        const dueDate = row.dueDate ? new Date(row.dueDate) : undefined;
        const validDue = dueDate && !isNaN(dueDate.getTime()) ? dueDate : undefined;

        return db.card.create({
          data: {
            title: row.title.trim(),
            listId,
            order: startOrder + i,
            description: row.description?.trim() || undefined,
            priority,
            dueDate: validDue,
          },
        });
      })
    );

    await createAuditLog({
      entityId: list.id,
      entityTitle: list.title,
      entityType: ENTITY_TYPE.LIST,
      action: ACTION.CREATE,
    });

    return NextResponse.json({ created: cards.length });
  } catch {
    return NextResponse.json({ error: "Failed to import cards" }, { status: 500 });
  }
}
