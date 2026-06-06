import { z } from "zod";

export const CreateLabel = z.object({
  boardId: z.string(),
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().min(1, "Color is required"),
});
