import { z } from "zod";
import { bundleBaseFields } from "@/lib/crm-schemas";

export const CreateBundle = z.object(bundleBaseFields);
