import { z } from "zod";

export const CreateKbFolder = z.object({
  industryId: z.string(),
  name: z.string().min(1, "Name is required").max(100),
});
