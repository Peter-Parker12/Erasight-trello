import { db } from "@/lib/db";

const DEFAULT_STAGES = [
  { name: "New", order: 0, isWon: false, isLost: false },
  { name: "Contacted", order: 1, isWon: false, isLost: false },
  { name: "Qualified", order: 2, isWon: false, isLost: false },
  { name: "Won", order: 3, isWon: true, isLost: false },
  { name: "Lost", order: 4, isWon: false, isLost: true },
];

// Creates a default pipeline for orgs that haven't configured one yet.
export const ensureDefaultPipelineStages = async (orgId: string) => {
  const count = await db.pipelineStage.count({ where: { orgId } });
  if (count > 0) return;

  await db.pipelineStage.createMany({
    data: DEFAULT_STAGES.map((stage) => ({ ...stage, orgId })),
  });
};
