"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { SaveCardTemplate } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { cardId } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: {
      checklists: { include: { items: { orderBy: { order: "asc" } } } },
      labels: { include: { label: true } },
    },
  });

  if (!card) return { error: "Card not found" };

  const checklistsJson = JSON.stringify(
    card.checklists.map((cl) => ({
      title: cl.title,
      items: cl.items.map((it) => ({ content: it.content })),
    }))
  );

  const labelsJson = JSON.stringify(
    card.labels.map((cl) => ({
      name: cl.label.name,
      color: cl.label.color,
    }))
  );

  const template = await db.cardTemplate.create({
    data: {
      orgId,
      title: card.title,
      description: card.description,
      checklistsJson,
      labelsJson,
      createdBy: userId,
    },
  });

  return { data: template };
};

export const saveCardTemplate = createSafeAction(SaveCardTemplate, handler);
