"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { canManageDepartmentData } from "@/lib/okr-access";
import { computeObjectiveScore } from "@/lib/okr-score";
import { CreateOkrCheckIn } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { objectiveId, note } = data;

  const objective = await db.objective.findUnique({
    where: { id: objectiveId },
    include: { keyResults: true },
  });
  if (!objective || objective.orgId !== orgId) return { error: "Objective not found." };

  const allowed = await canManageDepartmentData(orgId, objective.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const user = await currentUser();
  const userName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Unknown";

  const score = computeObjectiveScore(objective.keyResults);

  const checkIn = await db.okrCheckIn.create({
    data: {
      objectiveId,
      userId,
      userName,
      note: note || null,
      scoreAtCheckIn: score,
    },
  });

  revalidatePath(`/organization/${orgId}/okrs`, "layout");
  return { data: checkIn };
};

export const createOkrCheckIn = createSafeAction(CreateOkrCheckIn, handler);
