import { z } from "zod";

import { contactBaseFields } from "@/lib/crm-schemas";

export const CreateContact = z.object(contactBaseFields);
