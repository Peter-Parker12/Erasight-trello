import { z } from "zod";

export const CreateKbDocument = z.object({
  folderId: z.string(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  url: z.string().url("Must be a valid URL"),
  fileType: z.string().max(100).optional(),
  fileSize: z.number().int().positive().optional(),
});
