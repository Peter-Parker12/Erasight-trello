import { z } from "zod";
import type { ListTransitionRule } from "@prisma/client";

import type { ActionState } from "@/lib/create-safe-action";
import { UpsertListTransitionRule } from "./schema";

export type InputType = z.infer<typeof UpsertListTransitionRule>;
export type ReturnType = ActionState<InputType, ListTransitionRule | null>;
