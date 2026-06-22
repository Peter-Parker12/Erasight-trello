import { z } from "zod";
export const DeleteBundle = z.object({ id: z.string() });
