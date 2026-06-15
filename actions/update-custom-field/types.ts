import { z } from "zod";
import { CustomFieldDefinition } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { UpdateCustomField } from "./schema";

export type InputType = z.infer<typeof UpdateCustomField>;
export type ReturnType = ActionState<InputType, CustomFieldDefinition>;
