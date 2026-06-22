import { z } from "zod";
import { bundleBaseFields } from "@/lib/crm-schemas";

export const UpdateBundle = z.object({ id: z.string(), ...bundleBaseFields });
