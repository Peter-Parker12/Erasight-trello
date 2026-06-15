import { z } from "zod";
import { ApiKey } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteApiKey } from "./schema";

export type InputType = z.infer<typeof DeleteApiKey>;
export type ReturnType = ActionState<InputType, ApiKey>;
