import { z } from "zod";
export const DeleteProduct = z.object({ id: z.string() });
