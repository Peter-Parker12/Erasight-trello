import { z } from "zod";

export const DeleteDepartment = z.object({
  id: z.string(),
});
