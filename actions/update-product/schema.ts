import { z } from "zod";
import { productBaseFields } from "@/lib/crm-schemas";

export const UpdateProduct = z.object({ id: z.string(), ...productBaseFields });
