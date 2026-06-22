import { z } from "zod";

export const CreateList = z.object({
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
  boardId: z.string(),
});
