import { z } from "zod";

export const DeleteCompany = z.object({
  id: z.string(),
});
