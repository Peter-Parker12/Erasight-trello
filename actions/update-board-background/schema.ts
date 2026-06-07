import { z } from "zod";

export const UpdateBoardBackground = z.object({
  boardId: z.string(),
  backgroundType: z.enum(["image", "color", "gradient"]),
  backgroundColor: z.string().optional(),
});
