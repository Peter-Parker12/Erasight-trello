import { z } from "zod";
import { ApiKey } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateApiKey } from "./schema";

export type InputType = z.infer<typeof CreateApiKey>;
export type OutputType = ApiKey & { key: string };
export type ReturnType = ActionState<InputType, OutputType>;
