import { z } from "zod";

export const CreateBoard = z.object({
  title: z
    .string({ error: "Title is required." })
    .min(3, { message: "Title is too short." })
    .max(100, { message: "Title is too long." }),
  image: z.string({
    error: "Image is required.",
  }),
  workflowType: z.string().optional(),
});
