import { z } from "zod";

import { contactBaseFields } from "@/lib/crm-schemas";

export const UpdateContact = z.object({
  ...contactBaseFields,
  firstName: contactBaseFields.firstName.optional(),
  id: z.string(),
});
