import { z } from "zod";

import { leadBaseFields } from "@/lib/crm-schemas";

export const CreateLead = z.object(leadBaseFields);
