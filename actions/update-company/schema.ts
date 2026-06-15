import { z } from "zod";

import { companyBaseFields } from "@/lib/crm-schemas";

export const UpdateCompany = z.object({
  ...companyBaseFields,
  name: companyBaseFields.name.optional(),
  id: z.string(),
});
