import { z } from "zod";

import { companyBaseFields } from "@/lib/crm-schemas";

export const CreateCompany = z.object(companyBaseFields);
