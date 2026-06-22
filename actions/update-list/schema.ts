import { z } from "zod";

export const UpdateList = z.object({
  title: z
    .string({
      error: "Title is required.",
    })
    .min(3, {
      message: "Title is too short.",
    })
    .max(100, {
      message: "Title is too long.",
    }),
  id: z.string(),
  boardId: z.string(),
});
