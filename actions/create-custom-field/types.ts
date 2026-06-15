import { z } from "zod";
import { CustomFieldDefinition } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateCustomField } from "./schema";

export type InputType = z.infer<typeof CreateCustomField>;
export type ReturnType = ActionState<InputType, CustomFieldDefinition>;
