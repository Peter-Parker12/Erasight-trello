import { z } from "zod";

import { leadBaseFields } from "@/lib/crm-schemas";

export const UpdateLead = z.object({
  ...leadBaseFields,
  title: leadBaseFields.title.optional(),
  stageId: leadBaseFields.stageId.optional(),
  id: z.string(),
});
