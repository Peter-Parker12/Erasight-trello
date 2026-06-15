import { z } from "zod";
import { CustomFieldDefinition } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteCustomField } from "./schema";

export type InputType = z.infer<typeof DeleteCustomField>;
export type ReturnType = ActionState<InputType, CustomFieldDefinition>;
